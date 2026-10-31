import { MyTableClass } from './MyTable.js';

const myTable = new MyTableClass();
const tableContainer = document.getElementById('table-container');
const fileStatus = document.getElementById('file-status');
const fileInput = document.getElementById('file-open');
const btnSave = document.getElementById('file-save');
const btnSaveAs = document.getElementById('file-save-as');
const btnUndo = document.getElementById('btn-undo');
const btnAbout = document.getElementById('btn-about');

let currentFileName = 'mytable.txt';

function renderTable() {
    if (myTable.headers.length === 0) {
        tableContainer.innerHTML = '<div class="placeholder-text">Файл порожній або має невірний формат</div>';
        return;
    }

    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    myTable.headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    myTable.rows.forEach((rowData, rowIndex) => {
        const tr = document.createElement('tr');
        rowData.forEach((cellData, colIndex) => {
            const td = document.createElement('td');
            td.textContent = cellData;
            td.addEventListener('click', () => openCellEditor(td, rowIndex, colIndex));
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

function openCellEditor(td, rowIndex, colIndex) {
    if (td.querySelector('input')) return;

    const currentValue = myTable.rows[rowIndex][colIndex] || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();

    let saved = false;

    const saveEdit = () => {
        if (!saved) {
            saved = true;
            myTable.updateCell(rowIndex, colIndex, input.value);
            renderTable();
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            saved = true;
            renderTable();
        } else if (e.ctrlKey && e.code === 'KeyZ') {
            e.preventDefault();
            e.stopPropagation();
            saved = true;
            renderTable();
        }
    });

    input.addEventListener('blur', saveEdit);
}

function saveFile(filename) {
    const textToSave = myTable.saveToText();
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        currentFileName = file.name;
        fileStatus.textContent = `Файл: ${currentFileName}`;
        const reader = new FileReader();
        reader.onload = (e) => {
            myTable.loadFromText(e.target.result);
            renderTable();
        };
        reader.readAsText(file);
    }
});

btnSave.addEventListener('click', () => saveFile(currentFileName));
btnSaveAs.addEventListener('click', async () => {
    if (!window.showSaveFilePicker) {
        const newName = prompt('Введіть назву файлу:', currentFileName);
        if (newName) {
            currentFileName = newName;
            fileStatus.textContent = `Файл: ${currentFileName}`;
            saveFile(currentFileName);
        }
        return;
    }

    try {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: currentFileName,
            types: [{
                description: 'Текстові файли',
                accept: { 'text/plain': ['.txt'] }
            }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(myTable.saveToText());
        await writable.close();
        currentFileName = fileHandle.name;
        fileStatus.textContent = `Файл: ${currentFileName}`;
    } catch (error) {
        if (error.name !== 'AbortError') {
            alert(`Не вдалося зберегти файл: ${error.message}`);
        }
    }
});

btnUndo.addEventListener('click', () => {
    if (myTable.undoLastOperation()) {
        renderTable();
    }
});

btnAbout.addEventListener('click', () => {
    alert('Програма обробки табличних даних (Варіант 2)\nВиконано відповідно до обєктно-орієнтованих вимог.');
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (myTable.undoLastOperation()) {
            renderTable();
        }
    }
});