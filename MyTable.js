const HISTORY_LIMIT = 100;

export class MyTableClass {
   
    constructor() {
        this.headers = [];
        this.rows = [];
        this.history = [];
        this.redoHistory = [];
    }

    loadFromText(textData) {
        const lines = textData.trim().split(/\r?\n/);
        if (lines.length > 0) {
            this.headers = lines[0].split('\t');
            this.rows = lines.slice(1).map(line => line.split('\t'));
            this.history = [];
            this.redoHistory = [];
        }
    }

    saveToText() {
        const headerStr = this.headers.join('\t');
        const rowsStr = this.rows.map(row => row.join('\t')).join('\n');
        return `${headerStr}\n${rowsStr}`;
    }

    updateCell(rowIndex, colIndex, newValue) {
        const oldValue = this.rows[rowIndex][colIndex];
        if (oldValue !== newValue) {
            this.history.push({ rowIndex, colIndex, oldValue, newValue });
            if (this.history.length > HISTORY_LIMIT) {
                this.history.shift();
            }
            this.rows[rowIndex][colIndex] = newValue;
            this.redoHistory = [];
        }
    }

    undoLastOperation() {
        if (this.history.length > 0) {
            const lastAction = this.history.pop();
            this.rows[lastAction.rowIndex][lastAction.colIndex] = lastAction.oldValue;
            this.redoHistory.push(lastAction);
            return true;
        }
        return false;
    }

    redoLastOperation() {
        if (this.redoHistory.length > 0) {
            const lastAction = this.redoHistory.pop();
            this.rows[lastAction.rowIndex][lastAction.colIndex] = lastAction.newValue;
            this.history.push(lastAction);
            return true;
        }
        return false;
    }
}