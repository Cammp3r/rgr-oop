export class MyTableClass {
    constructor() {
        this.headers = [];
        this.rows = [];
        this.history = [];
        this.historyLimit = 100;
    }

    loadFromText(textData) {
        const lines = textData.trim().split(/\r?\n/);
        if (lines.length > 0) {
            this.headers = lines[0].split('\t');
            this.rows = lines.slice(1).map(line => line.split('\t'));
            this.history = [];
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
            this.history.push({ rowIndex, colIndex, oldValue });
            if (this.history.length > this.historyLimit) {
                this.history.shift();
            }
            this.rows[rowIndex][colIndex] = newValue;
        }
    }

    undoLastOperation() {
        if (this.history.length > 0) {
            const lastAction = this.history.pop();
            this.rows[lastAction.rowIndex][lastAction.colIndex] = lastAction.oldValue;
            return true;
        }
        return false;
    }
}