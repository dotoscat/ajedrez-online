'use strict';

const ADDRESS = HOST + ":" + PORT;
const startingPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const board = new Board();
const conn = new WebSocket('ws://' + ADDRESS + '/ws');
const boardViewer = new BoardViewer(document.getElementById("board"), board, (32+64)/2, conn);
const messages = new Messages(document.getElementById("messages"));
const historial = new Historial(document.getElementById("historial"));
messages.text = "Esperando un jugador...";
boardViewer.draw();
const game = new Game(conn, boardViewer, messages);
const whiteCounter = new PieceCounter("white");
whiteCounter.addToParent(document.getElementById("black"));
const blackCounter = new PieceCounter("black");
blackCounter.addToParent(document.getElementById("white"));
const startGame = new StartGame(document.getElementById("startbutton"));
const requestRestart = new RequestRestart(document.getElementById("request-restart"));
const promotion = new Promotion(document.getElementById("promotion"), boardViewer);
const requestDialog = new RequestDialog(document.getElementById("request-dialog"));
promotion.hide();
startGame.hide();
requestRestart.hide();
requestDialog.hide();
messages.element.style.width = getComputedStyle(document.getElementById("historial-container")).width;
