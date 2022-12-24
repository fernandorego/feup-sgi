import { parsePosition, checkValidPosition, getInitialPositions } from './gameUtils.js';
import { AnimationController } from './AnimationController.js';
import { Game, BLACK, WHITE } from './Game.js';
import { TextureController } from './TextureController.js';
import { MyPiece } from './MyPiece.js';
import { BoardButton } from './BoardButton.js';


export class GameController {
    constructor(scene) {
        this.scene = scene;
        this.scene.addPickListener(this);

        // controllers
        this.textureController = new TextureController(scene);
        this.animationController = new AnimationController(scene);

        // game
        this.game = null;
        this.pieces = new Map();
        this.blackButtons = {};
        this.whiteButtons = {};

        // selected piece
        this.selectedPiece = null;

        // init game
        this.initGame();
    }

    notifyPick(component) {
        if (component.id.includes('Piece')) {
            this.pickPiece(component);
        } else if (component.id.includes('position')) {
            this.pickPosition(component);
        } else if (component.id.includes('Button')) {
            this.pickButton(component);
        }
    }

    pickButton(component) {
        const buttonsMap = this.game.currentPlayer === BLACK ? this.blackButtons : this.whiteButtons;
        const button = buttonsMap[component.id];
        button.pick();
    }

    pickPiece(component) {
        if (this.selectedPiece != null) {
            this.cleanTextures();
        }

        let previousComponentID = this.selectedPiece != null ? this.selectedPiece.componentID : null;

        this.selectedPiece = this.pieces.get(component.id);

        if (this.game.currentPlayer != this.selectedPiece.color) {
            this.clean("Invalid piece to play. Turn: " + (this.game.currentPlayer === BLACK ? "black pieces" : "white pieces"));
            return;
        }

        if (previousComponentID === component.id) {
            this.clean()
            return;
        }

        this.selectedPiece.possibleMoves = this.game.possibleMoves(this.selectedPiece.position).map(move => move[1]);
        this.textureController.applyPossibleMoveTexture(this.selectedPiece.position, this.selectedPiece.possibleMoves);
    }

    pickPosition(component) {
        if (this.selectedPiece == null) {
            this.clean("Invalid position. Firstly, choose a valid " + (this.game.currentPlayer === BLACK ? "black piece" : "white piece"))
            return;
        }

        if (this.selectedPiece != null) {
            this.cleanTextures();
        }

        let pickedPosition = parsePosition(component);

        if (!checkValidPosition(this.selectedPiece.possibleMoves, pickedPosition)) {
            this.clean("Invalid move");
            return;
        }

        let currentPlayer = this.game.currentPlayer;

        this.game.move(this.selectedPiece.position, pickedPosition)
        this.game.printBoard();
        this.selectedPiece.position = pickedPosition;

        let [from, to, isCapture, nextToPlay] = this.game.moves[this.game.moves.length - 1];

        let capturedPieces = this._getCapturedPieces(from, to);

        let pickedComponent = this.scene.graph.components[this.selectedPiece.componentID];
        this.animationController.injectMoveAnimation(pickedComponent, from, to, capturedPieces);

        // force game camera
        this._setGameCamera();
        if (currentPlayer != nextToPlay) {
            this.animationController.injectCameraAnimation();
            this._updateBoardControls();
        }

        capturedPieces = null;
        this.selectedPiece = null;
    }

    clean(error = null) {
        if (error != null) {
            console.log(error);
        }
        this.selectedPiece = null;
    }

    cleanTextures() {
        this.textureController.cleanPossibleMoveTexture(this.selectedPiece.position, this.selectedPiece.possibleMoves);
    }

    async initGame() {
        this.game = new Game();

        let [initBlackPositions, initWhitePositions] = getInitialPositions();

        for (let [key, value] of initBlackPositions) {
            this.pieces.set('blackPiece' + key, new MyPiece(key, 'blackPiece' + key, BLACK, value));
        }

        for (let [key, value] of initWhitePositions) {
            this.pieces.set('whitePiece' + key, new MyPiece(key, 'whitePiece' + key, WHITE, value));
        }

        // TODO: Find better way to make sure graph is loaded
        await new Promise(r => setTimeout(r, 1000));

        // Init buttons console
        const blackConsoleID = 'blackPlayerButtons';
        const whiteConsoleID = 'whitePlayerButtons';
        for (const player of [BLACK, WHITE]) {
            const consoleID = player === BLACK ? blackConsoleID : whiteConsoleID;
            let consoleComponent = this.scene.graph.components[consoleID];
            const consoleButtons = player === BLACK ? this.blackButtons : this.whiteButtons;

            // Init start button
            const startButtonID = 'startButton';
            consoleButtons[startButtonID] = new BoardButton(this.scene, consoleComponent.children[startButtonID],
                consoleComponent, player, () => { this.start() });

            // Init undo button
            const undoButtonID = 'undoButton';
            consoleButtons[undoButtonID] = new BoardButton(this.scene, consoleComponent.children[undoButtonID],
                consoleComponent, player, () => { this.undo() });

            // Init movie button
            const movieButtonID = 'movieButton';
            consoleButtons[movieButtonID] = new BoardButton(this.scene, consoleComponent.children[movieButtonID],
                consoleComponent, player, () => { this.movie() });

            // Init switch scene button
            const switchSceneButtonID = 'switchSceneButton';
            consoleButtons[switchSceneButtonID] = new BoardButton(this.scene, consoleComponent.children[switchSceneButtonID],
                consoleComponent, player, () => { this.switchScene() });
        }

        console.log(this.blackButtons);
        console.log(this.whiteButtons);
    }

    _getCapturedPieces(from, to) {
        let capturedPieces = [];
        let xdelta = (to[0] > from[0]) ? 1 : -1;
        let ydelta = (to[1] > from[1]) ? 1 : -1;
        let current = from.slice();
        while (current[0] + xdelta != to[0] && current[1] + ydelta != to[1]) {
            current[0] += xdelta;
            current[1] += ydelta;
            this.pieces.forEach((piece, key) => {
                if (piece.position[0] === current[0] && piece.position[1] === current[1]) {
                    capturedPieces.push(key);
                }
            });
        }

        return capturedPieces;
    }

    _setGameCamera(gameCameraID = "gameCamera") {
        if (this.scene.graph.selectedCameraID == gameCameraID) { return; }

        this.scene.graph.selectedCameraID = gameCameraID;
        this.scene.camera = this.scene.graph.cameras[gameCameraID];
        this.scene.interface.setActiveCamera(this.scene.graph.cameras[gameCameraID]);
    }

    _updateBoardControls() {
        for (const buttonID in this.whiteButtons) {
            this.whiteButtons[buttonID].updateVisibility(this.game);
        }
        for (const buttonID in this.blackButtons) {
            this.blackButtons[buttonID].updateVisibility(this.game);
        }
    }

    undo() {
        alert("TODO: Undo");
    }

    movie() {
        alert("TODO: Movie");
    }

    switchScene() {
        alert("TODO: Switch Scene");
    }

    start() {
        alert("TODO: Start");
    }
}
