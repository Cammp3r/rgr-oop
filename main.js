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
let hasUnsavedChanges = false;

function updateFileStatus() {
    fileStatus.textContent = hasUnsavedChanges
        ? `Незбережено: ${currentFileName}`
        : `Файл: ${currentFileName}`;
    fileStatus.classList.toggle('unsaved', hasUnsavedChanges);
}

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
            const valueChanged = myTable.rows[rowIndex][colIndex] !== input.value;
            myTable.updateCell(rowIndex, colIndex, input.value);
            if (valueChanged) {
                hasUnsavedChanges = true;
                updateFileStatus();
            }
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
    if (!file) {
        return;
    }

    if (!file.name.toLowerCase().endsWith('.txt')) {
        alert('Можна відкривати тільки текстові файли з розширенням .txt.');
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            myTable.loadFromText(e.target.result);
            currentFileName = file.name;
            hasUnsavedChanges = false;
            updateFileStatus();
            renderTable();
        } catch (error) {
            alert(`Не вдалося обробити файл: ${error.message}`);
        }
    };
    reader.onerror = () => {
        alert('Не вдалося прочитати файл.');
    };
    reader.onabort = () => {
        alert('Читання файлу було перервано.');
    };
    reader.readAsText(file);
});

btnSave.addEventListener('click', () => {
    saveFile(currentFileName);
    hasUnsavedChanges = false;
    updateFileStatus();
});
btnSaveAs.addEventListener('click', async () => {
    if (!window.showSaveFilePicker) {
        const newName = prompt('Введіть назву файлу:', currentFileName);
        if (newName) {
            currentFileName = newName;
            saveFile(currentFileName);
            hasUnsavedChanges = false;
            updateFileStatus();
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
        hasUnsavedChanges = false;
        updateFileStatus();
    } catch (error) {
        if (error.name !== 'AbortError') {
            alert(`Не вдалося зберегти файл: ${error.message}`);
        }
    }
});

btnUndo.addEventListener('click', () => {
    if (myTable.undoLastOperation()) {
        hasUnsavedChanges = true;
        updateFileStatus();
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
            hasUnsavedChanges = true;
            updateFileStatus();
            renderTable();
        }
    }
});

window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
    }
});