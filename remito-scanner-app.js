// Array para almacenar los registros
let records = [];

// Referencias a elementos DOM
const barcodeInput = document.getElementById('barcodeInput');
const tableBody = document.getElementById('tableBody');
const recordCount = document.getElementById('recordCount');
const status = document.getElementById('status');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const closeBtn = document.getElementById('closeBtn');

// Función para parsear el código de barras
function parseBarcode(barcode) {
    if (!barcode || barcode.length < 38) {
        return null;
    }

    try {
        // Extraer campos según la estructura definida
        const codigoRemito = barcode.substring(0, 4);
        const numeroRemito = barcode.substring(4, 12);
        const fechaStr = barcode.substring(12, 20);
        const ce = barcode.substring(20, 26);
        const bultosStr = barcode.substring(26, 30);
        const kilosStr = barcode.substring(30, 38);
        const resto = barcode.substring(38);

        // Formatear remito
        const remito = codigoRemito + "-" + numeroRemito;

        // Formatear fecha (YYYYMMDD a DD/MM/YYYY)
        const fecha = fechaStr.substring(6, 8) + "/" + 
                      fechaStr.substring(4, 6) + "/" + 
                      fechaStr.substring(0, 4);

        // Bultos (convertir a entero)
        const bultos = parseInt(bultosStr, 10);

        // Kilos (dividir por 1000)
        const kilosNum = parseInt(kilosStr, 10) / 1000;
        const kilos = kilosNum.toFixed(3);

        // Valor declarado (extraer el número del resto)
        const valorMatch = resto.match(/(\d+\.?\d*)/);
        const valorDeclarado = valorMatch ? parseFloat(valorMatch[1]).toFixed(2) : "0.00";

        return {
            remito: remito,
            fecha: fecha,
            ce: ce,
            bultos: bultos,
            kilos: kilos,
            vDeclarado: valorDeclarado
        };
    } catch (error) {
        console.error("Error al parsear código de barras:", error);
        return null;
    }
}

// Función para mostrar mensaje de estado
function showStatus(message, isError = false) {
    status.textContent = message;
    status.className = isError ? 'status error' : 'status success';

    // Ocultar después de 3 segundos
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// Función para agregar un registro
function addRecord(data) {
    records.unshift(data); // Agregar al principio
    renderTable();
    updateCounter();
    showStatus('✓ Registro agregado exitosamente');
}

// Función para eliminar un registro
function deleteRecord(index) {
    records.splice(index, 1);
    renderTable();
    updateCounter();
    showStatus('Registro eliminado');
}

// Función para renderizar la tabla
function renderTable() {
    tableBody.innerHTML = '';

    records.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.remito}</td>
            <td>${record.fecha}</td>
            <td>${record.ce}</td>
            <td>${record.bultos}</td>
            <td>${record.kilos}</td>
            <td>${record.vDeclarado}</td>
            <td>
                <button class="delete-btn" onclick="deleteRecord(${index})">
                    ✖
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para actualizar contador
function updateCounter() {
    recordCount.textContent = records.length;
}

// Evento de entrada del código de barras
barcodeInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const barcode = this.value.trim();

        if (barcode) {
            const parsed = parseBarcode(barcode);

            if (parsed) {
                addRecord(parsed);
                this.value = ''; // Limpiar el input
            } else {
                showStatus('✖ Código de barras inválido. Verifique el formato.', true);
            }
        }
    }
});

// Mantener el foco en el input
barcodeInput.addEventListener('blur', function() {
    setTimeout(() => this.focus(), 100);
});

// Exportar a Excel
exportBtn.addEventListener('click', function() {
    if (records.length === 0) {
        showStatus('✖ No hay registros para exportar', true);
        return;
    }

    // Preparar datos para Excel
    const data = [
        ['Remito', 'Fecha', 'CE', 'Bultos', 'Kilos', 'V Declarado']
    ];

    records.forEach(record => {
        data.push([
            record.remito,
            record.fecha,
            record.ce,
            record.bultos,
            record.kilos,
            record.vDeclarado
        ]);
    });

    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Ajustar anchos de columna
    ws['!cols'] = [
        {wch: 15}, // Remito
        {wch: 12}, // Fecha
        {wch: 10}, // CE
        {wch: 8},  // Bultos
        {wch: 10}, // Kilos
        {wch: 15}  // V Declarado
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Remitos');

    // Generar nombre de archivo con fecha y hora
    const now = new Date();
    const filename = `Remitos_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, filename);

    showStatus('✓ Archivo exportado: ' + filename);
});

// Limpiar datos
clearBtn.addEventListener('click', function() {
    if (records.length === 0) {
        showStatus('No hay registros para limpiar', true);
        return;
    }

    if (confirm(`¿Está seguro de que desea eliminar todos los ${records.length} registros?`)) {
        records = [];
        renderTable();
        updateCounter();
        showStatus('Todos los registros han sido eliminados');
    }
});

// Cerrar aplicación
closeBtn.addEventListener('click', function() {
    if (confirm('¿Desea cerrar la aplicación?')) {
        window.close();
        // Si no se puede cerrar la ventana, mostrar mensaje
        setTimeout(() => {
            showStatus('Por favor, cierre manualmente esta pestaña/ventana', true);
        }, 500);
    }
});

// Inicializar
renderTable();
updateCounter();
barcodeInput.focus();