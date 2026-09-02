/* CIE 9618 Paper 1 SQL engine — sql.js backend with syllabus validation */
(function (global) {
  'use strict';

  var SQL_WASM_BASE = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/';

  var FORBIDDEN = [
    { re: /\bDROP\b/i, msg: 'DROP is not in the CIE 9618 syllabus.' },
    { re: /\bLEFT\s+JOIN\b/i, msg: 'LEFT JOIN is not in the syllabus. Use INNER JOIN.' },
    { re: /\bRIGHT\s+JOIN\b/i, msg: 'RIGHT JOIN is not in the syllabus. Use INNER JOIN.' },
    { re: /\bFULL\s+JOIN\b/i, msg: 'FULL JOIN is not in the syllabus. Use INNER JOIN.' },
    { re: /\bOUTER\s+JOIN\b/i, msg: 'OUTER JOIN is not in the syllabus. Use INNER JOIN.' },
    { re: /\bHAVING\b/i, msg: 'HAVING is not in the syllabus.' },
    { re: /\bLIMIT\b/i, msg: 'LIMIT is not in the syllabus.' },
    { re: /\bUNION\b/i, msg: 'UNION is not in the syllabus.' },
    { re: /\bCREATE\s+INDEX\b/i, msg: 'CREATE INDEX is not in the syllabus.' },
    { re: /\bAUTO_INCREMENT\b/i, msg: 'AUTO_INCREMENT is MySQL-specific and not in the syllabus.' },
    { re: /`/ , msg: 'Backtick identifiers are not used in CIE 9618 SQL.' },
    { re: /\(\s*SELECT\b/i, msg: 'Subqueries are not in the syllabus.' }
  ];

  function stripComments(sql) {
    return sql
      .split('\n')
      .map(function (line) {
        var i = 0;
        var inStr = false;
        while (i < line.length) {
          if (line[i] === "'") {
            inStr = !inStr;
            i++;
            continue;
          }
          if (!inStr) {
            if (line.slice(i, i + 2) === '--') return line.slice(0, i);
            if (line.slice(i, i + 2) === '//') return line.slice(0, i);
          }
          i++;
        }
        return line;
      })
      .join('\n');
  }

  function splitStatements(sql) {
    var parts = [];
    var cur = '';
    var inStr = false;
    for (var i = 0; i < sql.length; i++) {
      var c = sql[i];
      if (c === "'") {
        if (inStr && sql[i + 1] === "'") {
          cur += "''";
          i++;
          continue;
        }
        inStr = !inStr;
        cur += c;
      } else if (c === ';' && !inStr) {
        parts.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) parts.push(cur);
    return parts;
  }

  function validateSyllabus(sql) {
    for (var i = 0; i < FORBIDDEN.length; i++) {
      if (FORBIDDEN[i].re.test(sql)) {
        throw new Error(FORBIDDEN[i].msg);
      }
    }
  }

  function mapDataTypes(sql) {
    return sql
      .replace(/\bCHARACTER\b/gi, 'TEXT')
      .replace(/\bVARCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT')
      .replace(/\bBOOLEAN\b/gi, 'INTEGER')
      .replace(/\bDATE\b/gi, 'TEXT')
      .replace(/\bTIME\b/gi, 'TEXT');
  }

  function fixForeignKeySyntax(sql) {
    return sql.replace(
      /\bADD\s+FOREIGN\s+KEY\s+([A-Za-z_][A-Za-z0-9_]*)\s+REFERENCES\b/gi,
      'ADD FOREIGN KEY ($1) REFERENCES'
    );
  }

  function fixSelectAndAsComma(sql, mode) {
    if (mode !== 'textbook') return sql;
    var m = sql.match(/^(\s*SELECT\s+)([\s\S]+?)(\s+FROM\b)/i);
    if (!m) return sql;
    var list = m[2].replace(/\s+AND\s+/gi, ', ');
    return m[1] + list + m[3] + sql.slice(m[0].length);
  }

  function normalizeAggregateSpacing(sql) {
    return sql.replace(/\b(SUM|COUNT|AVG)\s+\(/gi, function (_, fn) {
      return fn.toUpperCase() + '(';
    });
  }

  function preprocessStatement(sql, mode) {
    var out = sql.trim();
    out = fixForeignKeySyntax(out);
    out = fixSelectAndAsComma(out, mode);
    out = normalizeAggregateSpacing(out);
    out = mapDataTypes(out);
    return out;
  }

  function quoteIdent(name) {
    return '"' + String(name).replace(/"/g, '""') + '"';
  }

  function tableKey(name) {
    return String(name).toUpperCase();
  }

  function splitColumnDefs(body) {
    var parts = [];
    var cur = '';
    var depth = 0;
    for (var i = 0; i < body.length; i++) {
      var c = body[i];
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (c === ',' && depth === 0) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }

  function parseCreateTable(sql) {
    var m = sql.match(/CREATE\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]+)\)\s*;?\s*$/i);
    if (!m) throw new Error('Invalid CREATE TABLE syntax.');
    var columns = splitColumnDefs(m[2]).map(function (def) {
      var cm = def.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
      if (!cm) throw new Error('Invalid column definition: ' + def);
      return { name: cm[1], sqliteType: cm[2].trim() };
    });
    return { tableName: m[1], columns: columns };
  }

  function SchemaManager(db) {
    this.db = db;
    this.tables = {};
    this.createOrder = [];
  }

  SchemaManager.prototype.get = function (name) {
    return this.tables[tableKey(name)];
  };

  SchemaManager.prototype.registerCreateTable = function (tableName, columns) {
    var key = tableKey(tableName);
    if (this.tables[key]) {
      throw new Error("Table '" + tableName + "' already exists.");
    }
    this.tables[key] = {
      name: tableName,
      columns: columns.slice(),
      pks: [],
      fks: [],
      materialized: false
    };
    this.createOrder.push(key);
  };

  SchemaManager.prototype.addPrimaryKey = function (tableName, cols) {
    var t = this.get(tableName);
    if (!t) throw new Error("Table '" + tableName + "' does not exist.");
    t.pks = cols.slice();
    this.rematerialize(t);
  };

  SchemaManager.prototype.addForeignKey = function (tableName, fromCol, toTable, toCol) {
    var t = this.get(tableName);
    if (!t) throw new Error("Table '" + tableName + "' does not exist.");
    t.fks.push({ from: fromCol, toTable: toTable, toCol: toCol });
    this.rematerialize(t);
  };

  SchemaManager.prototype.addColumn = function (tableName, colName, sqliteType) {
    var t = this.get(tableName);
    if (!t) throw new Error("Table '" + tableName + "' does not exist.");
    t.columns.push({ name: colName, sqliteType: sqliteType });
    if (t.materialized) {
      this.db.run(
        'ALTER TABLE ' + quoteIdent(t.name) + ' ADD COLUMN ' +
        quoteIdent(colName) + ' ' + sqliteType
      );
    }
  };

  SchemaManager.prototype.buildCreateSql = function (t) {
    var parts = t.columns.map(function (c) {
      return quoteIdent(c.name) + ' ' + c.sqliteType;
    });
    if (t.pks.length) {
      parts.push('PRIMARY KEY (' + t.pks.map(quoteIdent).join(', ') + ')');
    }
    t.fks.forEach(function (fk) {
      parts.push(
        'FOREIGN KEY (' + quoteIdent(fk.from) + ') REFERENCES ' +
        quoteIdent(fk.toTable) + '(' + quoteIdent(fk.toCol) + ')'
      );
    });
    return 'CREATE TABLE ' + quoteIdent(t.name) + ' (' + parts.join(', ') + ')';
  };

  SchemaManager.prototype.rematerialize = function (t) {
    if (t.materialized) {
      this.db.run('DROP TABLE IF EXISTS ' + quoteIdent(t.name));
      t.materialized = false;
    }
    this.db.run(this.buildCreateSql(t));
    t.materialized = true;
  };

  SchemaManager.prototype.materializeAll = function () {
    for (var i = 0; i < this.createOrder.length; i++) {
      var t = this.tables[this.createOrder[i]];
      if (!t.materialized) {
        this.db.run(this.buildCreateSql(t));
        t.materialized = true;
      }
    }
  };

  SchemaManager.prototype.reset = function () {
    this.tables = {};
    this.createOrder = [];
  };

  SchemaManager.prototype.getPlannedSchema = function () {
    var self = this;
    return this.createOrder.map(function (key) {
      var t = self.tables[key];
      return {
        name: t.name,
        columns: t.columns.map(function (c) {
          return {
            name: c.name,
            type: c.sqliteType,
            pk: t.pks.indexOf(c.name) >= 0 ? 1 : 0
          };
        }),
        foreignKeys: t.fks.slice()
      };
    });
  };

  function isCreateDatabase(sql) {
    return /^\s*CREATE\s+DATABASE\b/i.test(sql);
  }

  function parseDatabaseName(sql) {
    var m = sql.match(/CREATE\s+DATABASE\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    return m ? m[1] : 'Database';
  }

  function isCreateTable(sql) {
    return /^\s*CREATE\s+TABLE\b/i.test(sql);
  }

  function isAlterTable(sql) {
    return /^\s*ALTER\s+TABLE\b/i.test(sql);
  }

  function isSelect(sql) {
    return /^\s*SELECT\b/i.test(sql);
  }

  function isDeleteWithoutWhere(sql) {
    return /^\s*DELETE\s+FROM\s+[A-Za-z_][A-Za-z0-9_]*\s*;?\s*$/i.test(sql);
  }

  function parseAlterTable(sql) {
    var tm = sql.match(/ALTER\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)\s+ADD\s+(.+)$/i);
    if (!tm) throw new Error('Invalid ALTER TABLE syntax.');

    var tableName = tm[1];
    var action = tm[2].replace(/;+\s*$/, '').trim();

    var pk = action.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)$/i);
    if (pk) {
      return {
        type: 'pk',
        tableName: tableName,
        cols: pk[1].split(',').map(function (s) { return s.trim(); })
      };
    }

    var fk = action.match(/^FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]+)\)$/i);
    if (fk) {
      return {
        type: 'fk',
        tableName: tableName,
        fromCol: fk[1].trim(),
        toTable: fk[2],
        toCol: fk[3].trim()
      };
    }

    var col = action.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/);
    if (col) {
      return {
        type: 'column',
        tableName: tableName,
        colName: col[1],
        sqliteType: col[2].trim()
      };
    }

    throw new Error('Unsupported ALTER TABLE action.');
  }

  function Sql9618Engine() {
    this.SQL = null;
    this.db = null;
    this.schema = null;
    this.databaseName = null;
    this.mode = 'exam';
    this.ready = false;
  }

  Sql9618Engine.prototype.init = function () {
    var self = this;
    if (self.ready && self.db) return Promise.resolve();
    if (typeof initSqlJs !== 'function') {
      return Promise.reject(new Error('sql.js failed to load. Check your internet connection.'));
    }
    return initSqlJs({
      locateFile: function (file) {
        return SQL_WASM_BASE + file;
      }
    }).then(function (SQL) {
      self.SQL = SQL;
      self.resetDb();
      self.ready = true;
    });
  };

  Sql9618Engine.prototype.setMode = function (mode) {
    this.mode = mode === 'textbook' ? 'textbook' : 'exam';
  };

  Sql9618Engine.prototype.resetDb = function () {
    if (this.db) {
      try { this.db.close(); } catch (e) { /* ignore */ }
    }
    if (this.SQL) {
      this.db = new this.SQL.Database();
      this.db.run('PRAGMA foreign_keys = ON;');
      this.schema = new SchemaManager(this.db);
    } else {
      this.schema = null;
    }
    this.databaseName = null;
  };

  Sql9618Engine.prototype.runOne = function (raw, lineNum) {
    validateSyllabus(raw);

    if (isCreateDatabase(raw)) {
      var name = parseDatabaseName(raw);
      this.resetDb();
      this.databaseName = name;
      return {
        ok: true,
        type: 'ddl',
        message: "Database '" + name + "' created.",
        line: lineNum
      };
    }

    if (!this.db || !this.schema) {
      throw new Error('No database active. Run CREATE DATABASE first.');
    }

    var warning = null;
    if (isDeleteWithoutWhere(raw)) {
      warning = 'Warning: DELETE without WHERE removes all rows from the table.';
    }

    var sql = preprocessStatement(raw, this.mode);

    if (isCreateTable(sql)) {
      var created = parseCreateTable(sql);
      this.schema.registerCreateTable(created.tableName, created.columns);
      return {
        ok: true,
        type: 'ddl',
        message: "Table '" + created.tableName + "' created.",
        line: lineNum
      };
    }

    if (isAlterTable(sql)) {
      var alter = parseAlterTable(sql);
      if (alter.type === 'pk') {
        this.schema.addPrimaryKey(alter.tableName, alter.cols);
      } else if (alter.type === 'fk') {
        this.schema.addForeignKey(alter.tableName, alter.fromCol, alter.toTable, alter.toCol);
      } else {
        this.schema.addColumn(alter.tableName, alter.colName, alter.sqliteType);
      }
      return {
        ok: true,
        type: 'ddl',
        message: "Table '" + alter.tableName + "' altered successfully.",
        line: lineNum
      };
    }

    this.schema.materializeAll();

    if (isSelect(sql)) {
      var stmt = this.db.prepare(sql);
      var rows = [];
      var columns = stmt.getColumnNames();
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return {
        ok: true,
        type: 'select',
        columns: columns,
        rows: rows,
        warning: warning,
        line: lineNum
      };
    }

    this.db.run(sql);
    var changes = this.db.getRowsModified();
    var msg = changes === 1 ? '1 row affected.' : changes + ' rows affected.';

    return {
      ok: true,
      type: 'dml',
      message: msg,
      warning: warning,
      line: lineNum
    };
  };

  Sql9618Engine.prototype.runScript = function (script) {
    var cleaned = stripComments(script || '');
    var stmts = splitStatements(cleaned);
    var results = [];

    for (var i = 0; i < stmts.length; i++) {
      var raw = stmts[i].trim();
      if (!raw) continue;

      var approxLine = 1;
      var idx = script.indexOf(raw);
      if (idx >= 0) {
        approxLine = (script.slice(0, idx).match(/\n/g) || []).length + 1;
      }

      try {
        results.push(this.runOne(raw, approxLine));
      } catch (err) {
        results.push({
          ok: false,
          error: err.message || String(err),
          line: approxLine
        });
        break;
      }
    }

    return results;
  };

  Sql9618Engine.prototype.getSchema = function () {
    if (!this.schema) return [];
    this.schema.materializeAll();

    var planned = this.schema.getPlannedSchema();
    if (planned.length) return planned;

    if (!this.db) return [];
    var tablesRes = this.db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    if (!tablesRes.length) return [];

    var tables = [];
    var names = tablesRes[0].values.map(function (row) { return row[0]; });

    for (var t = 0; t < names.length; t++) {
      var tableName = names[t];
      var info = this.db.exec('PRAGMA table_info(' + quoteIdent(tableName) + ')');
      var cols = [];
      if (info.length) {
        cols = info[0].values.map(function (row) {
          return { name: row[1], type: row[2], pk: row[5] };
        });
      }
      var fkRes = this.db.exec('PRAGMA foreign_key_list(' + quoteIdent(tableName) + ')');
      var fks = [];
      if (fkRes.length) {
        fks = fkRes[0].values.map(function (row) {
          return { from: row[3], toTable: row[2], toCol: row[4] };
        });
      }
      tables.push({ name: tableName, columns: cols, foreignKeys: fks });
    }
    return tables;
  };

  global.Sql9618Engine = Sql9618Engine;
})(typeof window !== 'undefined' ? window : globalThis);
