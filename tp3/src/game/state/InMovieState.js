import { GameState } from './GameState.js';
import { BLACK, Game } from '../model/Game.js';
import { getInitialPositions } from '../view/Board.js';

export class InMovieState extends GameState {
    constructor(gameController) {
        super(gameController);
        this.currentMove = 0;
        this.currentToPlay = BLACK;
        this.flashedMovieEnd = false;
    }

    init() {
        this.gameController.reset();

        for (const buttonsMap of [this.gameController.blackButtons, this.gameController.whiteButtons]) {
            for (let button in buttonsMap) {
                if (button === "movieButton") {
                    buttonsMap[button].component.visible = true;
                    buttonsMap[button].setText("PLAY");
                } else if (button === "switchCameraButton") {
                    buttonsMap[button].component.visible = true;
                } else {
                    buttonsMap[button].component.visible = false;
                }
            }
        }

        this.gameController.uiController.flashToast("Playing movie...", null, true);
    }

    onTimeElapsed() {
        if (this.currentMove >= this.gameController.game.moves.length) {
            if (!this.flashedMovieEnd) {
                this.flashedMovieEnd = true;
                this.gameController.uiController.flashToast("Movie ended! Press PLAY to go back to the game.", null, true);
            }
            return;
        }

        let [from, to, _, nextToPlay] = this.gameController.game.moves[this.currentMove];

        let capturedPieces = this.gameController.getCapturedPieces(from, to);

        let pickedComponent = null;
        let piece = null;
        for (const [id, p] of this.gameController.pieces) {
            if (p.position[0] == from[0] && p.position[1] == from[1]) {
                pickedComponent = this.gameController.scene.graph.components[p.componentID];
                p.position = to;
                piece = p;
                break;
            }
        }

        if (pickedComponent == null) {
            console.error("Could not find piece to move in movie");
            return;
        }

        this.gameController.lightController.enableSpotlight(piece);
        this.gameController.animationController.injectMoveAnimation(pickedComponent, from, to,
            this.currentToPlay == BLACK ? to[0] == 0 : to[0] == 7, capturedPieces);

        // Update captured pieces marker
        if (this.currentToPlay === BLACK) {
            this.gameController.blackAuxiliaryBoard.addCapturedPieces(capturedPieces.length);
        } else {
            this.gameController.whiteAuxiliaryBoard.addCapturedPieces(capturedPieces.length);
        }

        this.currentMove += 1;

        this.currentToPlay = nextToPlay;
    }

    destruct() {
        this.gameController.undoReset();

        for (const buttonsMap of [this.gameController.blackButtons, this.gameController.whiteButtons]) {
            for (let button in buttonsMap) {
                buttonsMap[button].component.visible = true;
                if (button === "movieButton") {
                    buttonsMap[button].component.visible = true;
                    buttonsMap[button].setText("Watch");
                }
            }
        }

        this.gameController.uiController.hideToast();
        this.gameController.uiController.flashToast("Back to the game!");
    }
}