CIE 9618 pseudocode — language reference
Aligned with Cambridge International AS & A Level Computer Science pseudocode conventions (chapters 9–11 style). Examples match the classroom CIE 9618 Pseudocode IDE where noted.

CONTENTS

Structure of a pseudocode program
Data types
Variables, constants, and arrays
Displaying output
Formatting output
Procedures
Functions
Calling procedures and functions; by value and by reference
1. Structure of a pseudocode program

A pseudocode solution is a sequence of steps using keywords such as INPUT, OUTPUT, IF, FOR, and assignments. There is no single global “main” keyword: you usually list declarations and constants first, then define procedures and functions (if any), then write the main algorithm that calls them.

Conventions used in this IDE

Assignment uses <- or the arrow character ← (both accepted).
Comments: lines starting with // or # are ignored.
Definitions: PROCEDURE … ENDPROCEDURE and FUNCTION … ENDFUNCTION are written at the top level (not nested inside another routine in the current tool).
// Example skeleton
DECLARE count : INTEGER
CONSTANT maxVal <- 100

PROCEDURE showTitle
  OUTPUT "My program"
ENDPROCEDURE

CALL showTitle
count <- 0
2. Data types

In examinations, types are written after a colon in DECLARE lines. Typical types:

INTEGER — whole numbers.
REAL — decimal numbers.
BOOLEAN — TRUE / FALSE.
STRING — text (often in double quotes).
CHAR — a single character.
Expressions may use relational operators =, <>, <, >, <=, >=, and logic AND, OR, NOT. Integer division and remainder are written as DIV and MOD in pseudocode.

DECLARE score : INTEGER
DECLARE ok : BOOLEAN
score <- 17
ok <- (score >= 10) AND (score MOD 2 = 1)
3. Declaring variables, constants, and arrays

3.1 Variables

Use DECLARE with one identifier or several separated by commas, each group sharing one type:

DECLARE total : INTEGER
DECLARE firstName, lastName : STRING
DECLARE done : BOOLEAN
3.2 Constants

CONSTANT pi <- 3.142
CONSTANT appName <- "Pseudocode IDE"
3.3 One-dimensional arrays (notation)

In CIE-style pseudocode, a 1D array is declared with a colon between the lower and upper index, for example ARRAY[lower:upper] OF type. Elements are read or written with subscripts, e.g. List[i]. (This classroom IDE also accepts .. between bounds for compatibility.)

DECLARE List : ARRAY[1:10] OF INTEGER
DECLARE i : INTEGER

FOR i <- 1 TO 10
  List[i] <- i * 2
NEXT i
3.4 Two-dimensional arrays (notation)

A 2D array can be declared with two index ranges (rows and columns). Access uses two subscripts, e.g. Grid[r, c].

DECLARE Grid : ARRAY[1:4,1:5] OF INTEGER
DECLARE r : INTEGER
DECLARE c : INTEGER

FOR r <- 1 TO 4
  FOR c <- 1 TO 5
    Grid[r, c] <- r + c
  NEXT c
NEXT r
Note (classroom IDE): The reference above is the standard paper notation for CIE pseudocode. The browser IDE runs ARRAY[lo:hi] OF … (and 2D with comma-separated ranges) with subscripted read/write. For homework and exams, use the same notation on paper; test in the IDE when needed.
4. Displaying output

Use OUTPUT or PRINT (both are treated the same in the IDE). List one or more values separated by commas; they are shown on one line, separated by spaces.

OUTPUT "Hello"
OUTPUT "Answer = ", total
PRINT name, " ", score
5. Formatting output

Literal text — enclose in double quotes "like this" (single quotes are also accepted for simple literals in the IDE).
Multiple values — separate with commas; the IDE prints them in order with spaces between.
New lines — use a separate OUTPUT statement for each line you want on screen.
Prompts before input — output a message on one line, then use INPUT on the next (in the IDE, the input box or prompt can follow the last message shown).
OUTPUT "Name: ", userName
OUTPUT "Score: ", marks
OUTPUT ""
OUTPUT "Done."
6. Defining procedures

A procedure groups statements under a name. It does not return a value to an expression; use it for actions (printing, updating values passed by reference, etc.).

PROCEDURE lineOfStars (count : INTEGER)
  DECLARE j : INTEGER
  FOR j <- 1 TO count
    OUTPUT "*"
  NEXT j
  OUTPUT ""
ENDPROCEDURE
Parameters are listed in parentheses with types. Use BYREF for reference parameters (see section 8).

PROCEDURE reset (BYREF value : INTEGER)
  value <- 0
ENDPROCEDURE
7. Defining functions

A function returns a single value. The header ends with RETURNS type. Inside the function, RETURN followed by an expression sends the value back.

FUNCTION doubleIt (n : INTEGER) RETURNS INTEGER
  RETURN n * 2
ENDFUNCTION

FUNCTION areaOfRectangle (width : REAL, height : REAL) RETURNS REAL
  RETURN width * height
ENDFUNCTION
A function with no parameters:

FUNCTION readPinCode RETURNS INTEGER
  DECLARE code : INTEGER
  OUTPUT "Enter code"
  INPUT code
  RETURN code
ENDFUNCTION
8. Calling procedures and functions; by value and by reference

8.1 Calling procedures — CALL

Use CALL followed by the procedure name. Parentheses are optional when there are no arguments.

CALL lineOfStars (10)
CALL lineOfStars(5)
CALL showTitle
8.2 Calling functions — use the name in an expression

Functions are called like built-in functions: use their name and arguments where a value is needed.

DECLARE x : INTEGER
x <- doubleIt(7)
OUTPUT "Twice 7 = ", x
OUTPUT "Area = ", areaOfRectangle(4.0, 5.5)
8.3 Parameters by value (default)

If a parameter is declared without BYREF, the argument expression is evaluated and the procedure or function receives a copy. Changing the parameter inside the routine does not change the caller’s variable.

PROCEDURE tryChange (n : INTEGER)
  n <- 99
ENDPROCEDURE

DECLARE a : INTEGER
a <- 1
CALL tryChange(a)
OUTPUT a        // still 1
8.4 Parameters by reference — BYREF

With BYREF, the caller passes a variable name (not a complex expression). The routine works on the same storage as that variable, so updates are visible after the call. In the IDE, the argument must be a simple identifier.

PROCEDURE addBonus (BYREF score : INTEGER)
  score <- score + 10
ENDPROCEDURE

DECLARE mark : INTEGER
mark <- 40
CALL addBonus(mark)
OUTPUT mark        // 50
8.5 Mixing by-value and by-reference

PROCEDURE adjust (value : INTEGER, BYREF total : INTEGER)
  total <- total + value
ENDPROCEDURE

DECLARE sum : INTEGER
sum <- 100
CALL adjust(25, sum)
OUTPUT sum        // 125
CIE 9618 Pseudocode IDE — reference for teaching. For examination answers, follow the mark scheme and the pseudocode style shown in your approved textbook.
