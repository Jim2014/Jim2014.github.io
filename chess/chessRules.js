export function isLegalMove(piece, fromCell, toCell) {
    const pieceType = piece.dataset.type;
    const colorType = piece.dataset.color;

    if (toCell.hasChildNodes() && colorType == toCell.children[0].dataset.color) {
      return false
    }

    switch (pieceType) {
      case 'p':
        return isLegalPawnMove(colorType, fromCell, toCell);
      case 'b':
        return isLegalBishopMove(colorType, fromCell, toCell);
      case 'r':
        return isLegalRookMove(colorType, fromCell, toCell);
      case 'q':
        return isLegalRookMove(colorType, fromCell, toCell) || isLegalBishopMove(colorType, fromCell, toCell);
      case 'n':
        return isLegalKnightMove(colorType, fromCell, toCell);
      case 'k':
        return isLegalKingMove(colorType, fromCell, toCell);
  
      // Add cases for other piece types (rook, knight, bishop, queen, king) here
  
      default:
        return false;
    }
  }


function isLegalPawnMove(colorType, fromCell, toCell) {

    const fromRow = parseInt(fromCell.dataset.row, 10);
    const fromCol = parseInt(fromCell.dataset.col, 10);
    const toRow = parseInt(toCell.dataset.row, 10);
    const toCol = parseInt(toCell.dataset.col, 10);
  
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if (colorType === 'white' && fromRow == 6 && toRow == 4 && colDiff == 0 &&  !toCell.hasChildNodes()) {
      return true;
    }
    if (colorType === 'black' && fromRow == 1 && toRow == 3 && colDiff == 0 &&  !toCell.hasChildNodes()) {
      return true;
    }
 
    if (colorType === 'white' && toRow - fromRow != -1 ) return false;
    if (colorType === 'black' && toRow - fromRow != 1) return false;
    if (colDiff > 1) return false;
    if (toCol == fromCol) {
      return !toCell.hasChildNodes()
    } else {
      return toCell.hasChildNodes()
    }
  }
  
  function isLegalBishopMove(colorType, fromCell, toCell) {

    const fromRow = parseInt(fromCell.dataset.row, 10);
    const fromCol = parseInt(fromCell.dataset.col, 10);
    const toRow = parseInt(toCell.dataset.row, 10);
    const toCol = parseInt(toCell.dataset.col, 10);
  
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if(rowDiff != colDiff) return false;
    let rowIncrement = toRow > fromRow ? 1 : -1;
    let colIncrement = toCol > fromCol ? 1 : -1;
    for(let i=fromRow+rowIncrement, j = fromCol+colIncrement; i != toRow; i += rowIncrement, j += colIncrement) {
      if (board.children[i*8 + j].hasChildNodes()) {
        return false;
      }
    }

    return true

  }

  function isLegalRookMove(colorType, fromCell, toCell) {

    const fromRow = parseInt(fromCell.dataset.row, 10);
    const fromCol = parseInt(fromCell.dataset.col, 10);
    const toRow = parseInt(toCell.dataset.row, 10);
    const toCol = parseInt(toCell.dataset.col, 10);
  
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if(rowDiff > 0 && colDiff > 0) return false;
    let rowIncrement = rowDiff == 0 ? 0 : (toRow > fromRow ? 1 : -1);
    let colIncrement = colDiff == 0 ? 0 : (toCol > fromCol ? 1 : -1);
    for(let i = fromRow + rowIncrement, j = fromCol + colIncrement; i != toRow || j != toCol; i += rowIncrement, j += colIncrement) {
      if (board.children[i*8 + j].hasChildNodes()) {
        return false;
      }
    }

    return true

  }

  function isLegalKnightMove(colorType, fromCell, toCell) {

    const fromRow = parseInt(fromCell.dataset.row, 10);
    const fromCol = parseInt(fromCell.dataset.col, 10);
    const toRow = parseInt(toCell.dataset.row, 10);
    const toCol = parseInt(toCell.dataset.col, 10);
  
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if(rowDiff ==1 && colDiff ==2 ) return true;
    if(rowDiff ==2 && colDiff ==1 ) return true;

    return false

  }

  function isLegalKingMove(colorType, fromCell, toCell) {

    const fromRow = parseInt(fromCell.dataset.row, 10);
    const fromCol = parseInt(fromCell.dataset.col, 10);
    const toRow = parseInt(toCell.dataset.row, 10);
    const toCol = parseInt(toCell.dataset.col, 10);
  
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if(rowDiff <=1 && colDiff <=1 ) return true;

    return false

  }

  // Add functions for other piece types (rook, knight, bishop, queen, king) here

 
  