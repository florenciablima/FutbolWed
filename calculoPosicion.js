// ELEMENTOS DEL DOM

const table = document.getElementById("tablaPosiciones").getElementsByTagName("tbody")[0];
const form = document.getElementById("registroForm");
const dateMatch = document.getElementById("dateMatch");
const equipo1 = document.getElementById("equipo1");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const equipo2 = document.getElementById("equipo2");

let tournamentData = loadFromLocalStorage(); // Cargar datos previos si existen
let fechaActiva="Ninguna"; //Inicializar fecha activa
let partidosPorFecha = {}; //Inicializar objeto para almacenar los partidos por fecha

//----------------------------------------------------------------------------------------//

// MANEJADOR DEL EVENTO SUBMIT DEL FORMULARIO

function manejadorEnvioFormulario(event) {
    event.preventDefault(); // Evitamos el envío del formulario

    // Cargar los datos más recientes del LocalStorage para evitar problemas de sincronización
    tournamentData = loadFromLocalStorage();

    // Llama a la función de validación
    const esValido = validarFormulario();

    // Solo registra el partido si todas las validaciones son exitosas
    if (esValido) {
        // Capturamos los datos del partido
        const equipoLocal = equipo1.value;
        const equipoVisitante = equipo2.value;
        const golesLocal = parseInt(score1.value);
        const golesVisitante = parseInt(score2.value);

        // Creamos un objeto partido con los datos capturados
        const partido = {
            equipos: [
                { nombre: equipoLocal, goles: golesLocal },
                { nombre: equipoVisitante, goles: golesVisitante }
            ],
            fecha: fechaActiva
        };

        // Guardamos el partido en la lista de partidos de la fecha activa
        partidosPorFecha[fechaActiva].push(partido);
        tournamentData.push(partido); //Guardar el arreglo general
        saveToLocalStorage(tournamentData);

        // Actualizamos la tabla de posiciones y mostramos el nuevo partido
        actualizarPosicionTabla();
        

        // Limpiamos el formulario
        form.reset();
    }
}

//----------------------------------------------------------------------------------------//

// FUNCIÓN PARA GUARDAR EL ARREGLO EN EL ALMACENAMIENTO LOCAL
function saveToLocalStorage(data) {
    localStorage.setItem("tournamentData", JSON.stringify(data));
}

//----------------------------------------------------------------------------------------//

// FUNCIÓN PARA CARGAR LOS DATOS DESDE LOCALSTORAGE
function loadFromLocalStorage() {
    const data = localStorage.getItem("tournamentData");
    return data ? JSON.parse(data) : []; //Retorna un arreglo vacío si no hay datos en LocalStorage
}

//----------------------------------------------------------------------------------------//

//INICIALIZAR LOS DATOS Y EVENTOS EN LA CARGA DE LA PÁGINA
document.addEventListener("DOMContentLoaded", function() {
    const setFechaActivaBtn = document.getElementById("setFechaActivaBtn");
    if (setFechaActivaBtn) {
        setFechaActivaBtn.addEventListener("click", setFechaActiva);
    }
    actualizarPosicionTabla(); // Actualiza la tabla de posiciones con los datos de LocalStorage
});

//----------------------------------------------------------------------------------------//

// FUNCÓN PARA ACTUALIZAR LA TABLA DE POSICIONES

function actualizarPosicionTabla() {
    const tournamentData = loadFromLocalStorage();
    const equipos = {};

    // Calcular puntos, GAF y GEC de cada equipo
    tournamentData.forEach(match => {
        const equipo1 = match.equipos[0];
        const equipo2 = match.equipos[1];

        // Normalizar los nombres de los equipos
        const nombreEquipo1 = equipo1.nombre.trim().toLowerCase();
        const nombreEquipo2 = equipo2.nombre.trim().toLowerCase();

        // Inicializar equipos si no existen, conservando el nombre original para mostrarlo

        if (!equipos[nombreEquipo1]) {
            equipos[nombreEquipo1] = { nombre: equipo1.nombre, puntos: 0, gaf: 0, gec: 0 };

        }
        if (!equipos[nombreEquipo2]) {
            equipos[nombreEquipo2] = { nombre: equipo2.nombre, puntos: 0, gaf: 0, gec: 0 };
        }
        
        // Calcular GAF y GEC
        equipos[nombreEquipo1].gaf += equipo1.goles;
        equipos[nombreEquipo1].gec += equipo2.goles;
        equipos[nombreEquipo2].gaf += equipo2.goles;
        equipos[nombreEquipo2].gec += equipo1.goles;

        // Asignar puntos según los goles
        if (equipo1.goles > equipo2.goles) {
            equipos[nombreEquipo1].puntos += 3;
        } else if (equipo1.goles < equipo2.goles) {
            equipos[nombreEquipo2].puntos += 3;
        } else {
            equipos[nombreEquipo1].puntos += 1;
            equipos[nombreEquipo2].puntos += 1;
        }
    });

    // Convertir el objeto en un array y ordenar por puntos
    const equiposArray = Object.keys(equipos).map(equipo => ({
        nombre: equipo,
        puntos: equipos[equipo].puntos,
        gaf: equipos[equipo].gaf,
        gec: equipos[equipo].gec
    })).sort((a, b) => b.puntos - a.puntos);

    // Limpiar la tabla
    const table = document.getElementById("tablaPosiciones").getElementsByTagName('tbody')[0];
    table.innerHTML = '';

    // Agregar filas de equipos
    equiposArray.forEach((equipo, index) => {
        const row = table.insertRow();
        row.insertCell(0).textContent = equipo.nombre;       // Equipo
        row.insertCell(1).textContent = equipo.puntos;       // Puntos
        row.insertCell(2).textContent = index + 1;           // Posición
        row.insertCell(3).textContent = equipo.gaf;          // GAF
        row.insertCell(4).textContent = equipo.gec;          // GEC

        const actionsCell = row.insertCell(5);               // Acciones
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-danger btn-sm";
        deleteBtn.textContent = "Eliminar";
        deleteBtn.onclick = () => removeEquipo(equipo.nombre);
        actionsCell.appendChild(deleteBtn);

        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-warning btn-sm mx-1";
        editBtn.textContent = "Editar";
        editBtn.onclick = () => editarEquipo(equipo.nombre);
        actionsCell.appendChild(editBtn);
    });
}

//----------------------------------------------------------------------------------------//

//FUNCIÓN PARA ELIMINAR UN EQUIPO

function removeEquipo(nombreEquipo) {
    const equipoNormalizado = nombreEquipo.trim().toLowerCase();

    // Filtrar los partidos que no contengan el equipo a eliminar
    let tournamentData = loadFromLocalStorage();
    tournamentData = tournamentData.filter(
        match => !match.equipos.some(e => e.nombre.trim().toLowerCase() === equipoNormalizado)
    );

    saveToLocalStorage(tournamentData);
    actualizarPosicionTabla();
}


//----------------------------------------------------------------------------------------//

// FUNCIÓN PARA EDITAR EL ÚLTIMO PARTIDO INGRESADO
function editarEquipo() {
    let tournamentData = loadFromLocalStorage();

    // Verificar si hay partidos registrados
    if (tournamentData.length === 0) {
        alert("No hay partidos registrados para editar.");
        return;
    }

    // Obtener el último partido ingresado
    const partidoAEditar = tournamentData[tournamentData.length - 1];

    const equipo1 = partidoAEditar.equipos[0];
    const equipo2 = partidoAEditar.equipos[1];

    // Obtener nuevos valores a través de prompts
    const nuevoNombreEquipo1 = prompt("Ingrese el nuevo nombre para el equipo local:", equipo1.nombre) || equipo1.nombre;
    const nuevosGolesEquipo1 = parseInt(prompt("Ingrese los nuevos goles para el equipo local:", equipo1.goles), 10) || equipo1.goles;
    
    const nuevoNombreEquipo2 = prompt("Ingrese el nuevo nombre para el equipo visitante:", equipo2.nombre) || equipo2.nombre;
    const nuevosGolesEquipo2 = parseInt(prompt("Ingrese los nuevos goles para el equipo visitante:", equipo2.goles), 10) || equipo2.goles;

    // Actualizar los valores del partido
    partidoAEditar.equipos[0].nombre = nuevoNombreEquipo1;
    partidoAEditar.equipos[0].goles = nuevosGolesEquipo1;
    
    partidoAEditar.equipos[1].nombre = nuevoNombreEquipo2;
    partidoAEditar.equipos[1].goles = nuevosGolesEquipo2;

    // Guardar los cambios en el almacenamiento local
    saveToLocalStorage(tournamentData);

    // Actualizar la tabla de posiciones
    actualizarPosicionTabla();
}

//----------------------------------------------------------------------------------------//

// FUNCIÓN PARA VALIDAR EL FORMULARIO ANTES DE REGISTRAR EL PARTIDO

function validarFormulario() {
    const fecha = fechaActiva;
    const equipoLocal = equipo1.value.trim();
    const equipoVisitante = equipo2.value.trim();
    const golesLocal = parseInt(score1.value, 10);
    const golesVisitante = parseInt(score2.value, 10);

    // 1. Verificar que los nombres de los equipos tengan al menos 3 letras
    if (equipoLocal.length < 3 || equipoVisitante.length < 3) {
        alert("Cada equipo debe tener un nombre de al menos 3 letras.");
        return false;
    }

    // 2. Verificar que el equipo no juegue contra sí mismo
    if (equipoLocal === equipoVisitante) {
        alert("Un equipo no puede jugar contra sí mismo.");
        return false;
    }

    // 3. Verificar que los goles sean valores enteros >= 0
    if (isNaN(golesLocal) || golesLocal < 0 || isNaN(golesVisitante) || golesVisitante < 0) {
        alert("Los goles deben ser valores enteros mayores o iguales a 0.");
        return false;
    }

    // 4. Verificar que el equipo no esté duplicado en la misma fecha activa
    const partidosFechaActual = partidosPorFecha[fecha] || [];
    const equipoYaJugado = partidosFechaActual.some(
        (partido) => partido.equipos[0].nombre === equipoLocal || partido.equipos[1].nombre === equipoLocal || 
                     partido.equipos[0].nombre === equipoVisitante || partido.equipos[1].nombre === equipoVisitante
    );

    if (equipoYaJugado) {
        alert("Un equipo no puede jugar dos veces en la misma fecha.");
        return false;
    }

    // Si todas las validaciones pasan, permite el registro del partido
    return true;
}

//----------------------------------------------------------------------------------------//

//FUNCIÓN PARA ESTABLECER LA FECHA DISPUTADA ACTIVA

function setFechaActiva() {
    const nuevaFecha = dateMatch.value.trim();
    if (nuevaFecha) {
        fechaActiva = nuevaFecha;
        document.getElementById("fechaDisputadaDisplay").innerHTML = `<h2>Fecha disputada: ${fechaActiva}</h2>`;
        dateMatch.value = ''; // Limpiar el campo de la fecha

        // Inicializar array vacío si no existen partidos en la fecha seleccionada
        if (!partidosPorFecha[fechaActiva]) {
            partidosPorFecha[fechaActiva] = [];
        }
    } else {
        alert("Por favor, ingresa una fecha válida.");
    }
}














