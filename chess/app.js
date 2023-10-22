import { isLegalMove } from './chessRules.js';


let selectedPiece = null;
let selectedCell = null;
let moveHistory = []; // Add a variable to store the move history


const board = document.getElementById("board");
const initialPosition = [
    "RNBQKBNR",
    "PPPPPPPP",
    "        ",
    "        ",
    "        ",
    "        ",
    "pppppppp",
    "rnbqkbnr",
  ];
  
  function createBoard() {
    board.addEventListener("click", onBoardClick);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let cell = document.createElement("div");
        cell.className = "cell";
        cell.classList.add((i + j) % 2 === 0 ? "light" : "dark");
        cell.dataset.row = i;
        cell.dataset.col = j;
        let piece = initialPosition[i][j];
        if (piece !== " ") {
          let pieceElement = document.createElement("span");
          pieceElement.className = "piece";
          pieceElement.classList.add(isLowerCase(piece) ? "white" : "black");
          pieceElement.innerHTML = getPieceUnicode(piece);
          pieceElement.dataset.type = piece.toLowerCase();
          pieceElement.dataset.color = isLowerCase(piece) ? "white" : "black";
          cell.appendChild(pieceElement);
        }
        board.appendChild(cell);
      }
    }
  }
  
 

  
// Add a new variable to track the current turn, 'w' for white and 'b' for black
let currentTurn = 'white';

// Replace the onBoardClick function with this updated version
function onBoardClick(e) {
  const target = e.target;
  const cell = target.classList.contains("cell") ? target : target.parentElement;

  console.log("Clicked target:", target);
  console.log("Clicked cell:", cell);

  if (!selectedPiece && target.classList.contains("piece")) {
    // Check if it's the correct color's turn
    if (target.dataset.color !== currentTurn) {
      console.log(target.dataset.color)
      console.log("Not the correct color's turn");
      return;
    }

    // First click: Select the piece and highlight the cell
    selectedPiece = target;
    selectedCell = cell;
    cell.classList.add("selected");
    selectedPiece.classList.add("selected-piece");
    console.log("Selected piece:", selectedPiece);

    // Show possible moves for the selected piece
    const legalMoves = getLegalMoves(selectedPiece, selectedCell);
    legalMoves.forEach(moveCell => moveCell.classList.add("possible-move"));
  } else if (selectedPiece) {
    // Clear possible moves when the piece is moved or deselected
    clearPossibleMoves();

    // Second click: Attempt to move or capture
    const targetPiece = cell.querySelector(".piece");

    // Check if the target cell has a piece with the same color
    if (targetPiece && targetPiece.dataset.color === selectedPiece.dataset.color) {
      // Prevent moving the piece if the target cell has a piece with the same color
      console.log("Preventing move due to same color piece");
      clearSelection();
      return;
    }

     // Check if the move is legal before moving the piece
     if (!isLegalMove(selectedPiece, selectedCell, cell)) {
      console.log("Illegal move");
      clearSelection();
      return;
    }



    // Capture the piece if the target cell has a piece with a different color
    if (targetPiece) {
      console.log("Capturing piece:", targetPiece);
      targetPiece.remove();
    }

    // Move the piece to the target cell
    console.log("Moving piece to target cell");
    cell.appendChild(selectedPiece);

    // Check if the pawn was promoted
    const wasPawnPromoted = shouldProtePawn(selectedPiece);


    // Save the move to move history before making the move
    moveHistory.push({
      from: selectedCell,
      to: target,
      movedPiece: selectedPiece,
      capturedPiece: targetPiece,
      wasPawnPromoted
    });
    // Check for pawn promotion
    if (shouldProtePawn(selectedPiece)) {
      promotePawn(selectedPiece);
    }

    clearSelection();

    // Change the current turn to the opposite color
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    updateInfoArea();


  }
}



  
    
  
  


function isLowerCase(str) {
    return str.toLowerCase() === str;
}

function clearSelection() {
  if (selectedCell) {
    selectedCell.classList.remove("selected");
    selectedCell = null;
  }
  if (selectedPiece) {
    selectedPiece.classList.remove("selected-piece");
    selectedPiece = null;
  }
}

function getPieceUnicode(piece) {
    const pieceMap = {
        "r": "&#9820;",
        "n": "&#9822;",
        "b": "&#9821;",
        "q": "&#9819;",
        "k": "&#9818;",
        "p": "&#9823;",
    };
    return pieceMap[piece.toLowerCase()];
}

function clearPossibleMoves() {
  const possibleMoveCells = document.querySelectorAll(".possible-move");
  possibleMoveCells.forEach(cell => cell.classList.remove("possible-move"));
}

function getLegalMoves(piece, fromCell) {
  const legalMoves = [];

  // Iterate through all the cells on the board
    for (const cell of board.children) {
      const toRow = parseInt(cell.dataset.row, 10);
      const toCol = parseInt(cell.dataset.col, 10);
      // console.log("Check isLegalMove:" , cell)
      // Check if the current cell is a legal move
      if (isLegalMove(piece, fromCell, cell)) {
        legalMoves.push(cell);
       
        console.log("isLegalMove:" , toRow, toCol)
      }
    }

  return legalMoves;
}

function updateInfoArea() {
  const turnInfo = document.getElementById('turn-info');
  const moveList = document.getElementById('move-list');

  turnInfo.textContent = currentTurn === 'white' ? 'White to move' : 'Black to move';

  // Clear the current move list
  moveList.innerHTML = '';

  // Display the move history in the move list
  moveHistory.forEach((move, index) => {
    const moveText = document.createElement('p');
    moveText.textContent = `${index + 1}. ${moveToString(move)}`;
    moveList.insertBefore(moveText, moveList.firstChild);
  });
}


function shouldProtePawn(selectedPiece) {
  if (selectedPiece.dataset.type === 'p') {
    let row = selectedPiece.parentElement.dataset.row
    if ((currentTurn === 'white' && row == 0) || (currentTurn === 'black' && row == 7)) {
      return true;
    }
  }
  return false;
}
// Add a function to promote a pawn to a queen
function promotePawn(pawn) {
  pawn.textContent = '♛';
  pawn.dataset.type = 'q';
}

// Add a function to undo the last move
function undoMove() {
  if (moveHistory.length === 0) {
    console.log('No moves to undo');
    return;
  }

  const lastMove = moveHistory.pop();
  const { from, to, movedPiece, capturedPiece, wasPawnPromoted } = lastMove;

  // Restore the moved piece to its original position
  from.appendChild(movedPiece);

  // If the pawn was promoted, revert it back to a pawn
  if (wasPawnPromoted) {
    movedPiece.textContent = movedPiece.dataset.color === 'white' ? '♙' : '♟';
    movedPiece.dataset.type = 'p';
  }

  // Remove the captured piece from the target cell if it's still there
  if (capturedPiece && to.contains(capturedPiece)) {
    to.removeChild(capturedPiece);
  }

  // Restore the captured piece if there was any
  if (capturedPiece) {
    to.appendChild(capturedPiece);
  } else {
    to.innerHTML = '';
  }

  // Revert the current turn
  currentTurn = currentTurn === 'white' ? 'black' : 'white';

  // Update the info area
  updateInfoArea();
}

function moveToString(move) {
  const fromRow = 8 - parseInt(move.from.dataset.row);
  const fromCol = move.from.dataset.col;
  const toRow = 8 - parseInt(move.to.dataset.row);
  const toCol = move.to.dataset.col;

  const fromSquare = String.fromCharCode(97 + parseInt(fromCol)) + fromRow;
  const toSquare = String.fromCharCode(97 + parseInt(toCol)) + toRow;

  const pieceType = move.movedPiece.dataset.type;
  const pieceSymbol = pieceType === 'p' ? '' : pieceType.toUpperCase();

  const isCapture = move.capturedPiece !== null;
  const captureSymbol = isCapture ? 'x' : '';

  const isPromotion = move.wasPawnPromoted;
  const promotionSymbol = isPromotion ? '=Q' : '';

  return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}${promotionSymbol}`;
}


// Add event listener for the undo button
document.getElementById('undo-button').addEventListener('click', undoMove);

createBoard();
updateInfoArea();