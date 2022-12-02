import { AppController } from './AppController.js';

/**
 * Parse url variables to get the right file
 * @return {*} 
 */
function getUrlVars() {
    const vars = {};
    const parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function (m, key, value) {
            vars[decodeURIComponent(key)] = decodeURIComponent(value);
        });
    return vars;
}

function main() {
    const file = getUrlVars()["file"];
    const gameController = new AppController(file ? [file] : ["demo.xml", "test_board.xml"]);
    gameController.start();
}

main();
