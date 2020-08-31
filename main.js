var _dataObj;
window.onload = () => {
   let btnColor = document.getElementById("btnColor")
   let { elements, settings } = setConfiguration()
   //Inicializacion del componente HandsOnTable.
   var puo = new Handsontable(elements, settings)
   setHook(puo, "afterChange")
   setHook(puo, "afterColumnMove")
   setHook(puo, "afterSetCellMeta")

   setColorRow(puo)
   clickSaveAs(puo)
}

//#region Getters
//Obtiene los campos tipo Date que se encuentran segun la configuracion de las columnas.
const getDate = (settings) => {
   let dates = []
   settings.columns.forEach((column, index) => {
      let obj = {}
      if (column.type === "date") {
         obj.name = column.data
         obj.index = index
         dates.push(obj)
      }
   })
   return dates;
}
//Obtiene el valor que viene desde el servidor.
const getOldChange = (indexRow, nameColumn) => {
   let obj = JSON.parse(_dataObj)[indexRow]
   return obj[nameColumn]
}
//#endregion

//#region Setters
//Setea el evento que quiere usarse.
const setHook = (instance, typeHook) => {

   if (typeHook === "afterSetCellMeta") {
      instance.addHook(typeHook, (row, col, key, value) => {
         if (key === "comment") {
            setColor(instance, row, "#ff0000")
         }
      })
   }

   instance.addHook(typeHook, (changes) => {
      if (typeHook === "afterChange") {
         changes.forEach(change => {
            let rowIndex = change[0]
            if (wasChange(instance, rowIndex))
               setColor(instance, rowIndex, "#ff0000")
            else
               setColor(instance, rowIndex)
         })
      } else if (typeHook === "afterColumnMove") {
         let newHeaders = nestedHeaders()
         newHeaders[1] = instance.getColHeader()
         instance.updateSettings({
            nestedHeaders: newHeaders
         })
      }
   })
}
//Ejemplo de funcion filter
var filter = function (array, conditionFunction) {
   var validValues = [];
   for (var index = 0; index < array.length; index++) {
      if (conditionFunction(array[index])) {
         validValues.push(array[index]);
      }
   }
   return validValues;
}
//Setea el row un color de letra para detectar que es una fila modificada.
const setColor = (instance, rowIndex, color = "#363636") => {
   let style = document.getElementsByTagName("style")
   if (style.length < 1) {
      style = document.createElement('style');
   } else {
      style = style[0]
   }
   let nameStyle = `.handsontable .color_${color.substring(1)}`
   if (!style.textContent.includes(nameStyle)) {
      style.innerHTML += `${nameStyle} { color: ${color = (color.includes("#")) ? color : `#${color}`}; }`;
      document.getElementsByTagName('head')[0].appendChild(style);
   }

   for (var index = 0; index < instance.countCols(); index++) {

      let className = instance.getCellMeta(rowIndex, index).className || "";
      let classNameFilter = []
      let newStyle = ""

      newStyle = nameStyle;

      className.split(" ").forEach(name => {
         if (!name.includes("color") && !name.includes("handsontable")) {
            classNameFilter.push(name)
         }
      })

      classNameFilter.forEach(className => {
         newStyle += ` ${className}`
      })

      instance.setCellMeta(rowIndex, index, 'className', newStyle.replace(".", "").replace(".", ""))
   }
   instance.render()
}
//Setea el color de los rows que se encuentran seleccionados.
const setColorRow = (instance) => {
   const colorPicker = document.getElementById("colorPicker")
   const btnColor = document.getElementById("btnColor")

   btnColor.onclick = () => {
      instance.getSelected().forEach(selected => {
         let props = {
            rowStart: selected[0],
            colStart: selected[1],
            rowEnd: selected[2],
            colEnd: selected[3]
         }
         setBackgroundColor(instance, props, colorPicker.value)
      })
   }
}
//Setea el row con un background color a la fila seleccionada y coloreada.
const setBackgroundColor = (instance, props, color = "#FFF") => {
   let style = document.getElementsByTagName("style")
   if (style.length < 1) {
      style = document.createElement('style');
   } else {
      style = style[0]
   }
   let nameStyle = `.handsontable .bgc_${color.substring(1)}`
   if (!style.textContent.includes(nameStyle)) {
      style.innerHTML += `${nameStyle} { background-color: ${color = (color.includes("#")) ? color : `#${color}`}; }`;
      document.getElementsByTagName('head')[0].appendChild(style);
   }

   for (props.rowStart; props.rowStart <= props.rowEnd; props.rowStart++) {
      let rowIndex
      let colStart;

      if (props.rowStart < 0) {
         rowIndex = 0
      } else {
         rowIndex = props.rowStart
      }
      if (props.colStart < 0) {
         colStart = 0
      } else {
         colStart = props.colStart
      }

      for (colStart; colStart <= props.colEnd; colStart++) {
         let colIndex = colStart
         let className = instance.getCellMeta(rowIndex, colIndex).className || "";
         let classNameFilter = []
         let newStyle = ""

         newStyle = nameStyle;
         className.split(" ").forEach(name => {
            if (!name.includes("bgc") && !name.includes("handsontable")) {
               classNameFilter.push(name)
            }
         })

         classNameFilter.forEach(className => {
            newStyle += ` ${className}`
         })
         instance.setCellMeta(rowIndex, colIndex, 'className', newStyle.replace(".", "").replace(".", ""))
      }
   }

   instance.render()

}
//#endregion

//#region Private Methods
//Verifica con respecto al valor devuelto por el servidor si hubo cambio sobre la fila o no.
const wasChange = (instance, rowIndex) => {
   let oldRow = converterRow(JSON.parse(_dataObj)[rowIndex], nestedHeaders()[1])
   let newRow = converterRow(instance.getDataAtRow(rowIndex), instance.getColHeader())

   let value = Object.keys(oldRow).find(key => oldRow[key] !== newRow[key]) || null;

   return value !== null
}
//Arma objeto segun el nombre de las columnas
const converterRow = (row, columnsName) => {
   let newObj = {}
   let keys = Object.keys(row);
   keys.forEach((key, index) => {
      newObj[`${columnsName[index]}`] = row[key]
   })
   return newObj;
}
//Obtienen los pendientes con respecto a lo que viene del servidor.
const getPendingChange = (instance) => {
   let listChange = []
   for (var index = 0; index < instance.countRows(); index++) {
      let obj = {}
      if (wasChange(instance, index)) {
         instance.getDataAtRow(index).forEach((cell, i) => {
            let column = instance.getCellMetaAtRow(1).filter(column => column.visualCol === i)
            obj[`${column[0].prop}`] = cell
         })
         listChange.push(obj)
      }
   }
   return listChange;
}
//Obtiene los comentarios que se encuentran agregados.
const getComments = (instance) => {
   let listComments = []
   let objRow = {}
   for (var index = 0; index < instance.countRows(); index++) {
      let row = instance.getCellMetaAtRow(index)
      let comments = []

      row.forEach(column => {

         let nameClass = column.className || "";
         if (nameClass.length > 0) {
            if (column.prop == "NroSerie") {
               objRow[`${column.prop}`] = instance.getDataAtCell(column.row, column.col)
            }

            if (column.comment != null) {
               let comment = {
                  name: column.prop,
                  value: column.comment.value
               }
               comments.push(comment)
            }
         }
      })
      if (comments.length > 0) {
         objRow.comments = comments
         listComments.push(objRow)
      }
   }
   console.log(listComments)
}
//Obtiene los rows o campos que se encuentran pintados.
const getRowsStyles = (instance) => {
   let objRow = {}
   let listColors = []
   for (var index = 0; index < instance.countRows(); index++) {
      let colors = []
      let row = instance.getCellMetaAtRow(index)
      objRow = {}

      row.forEach(column => {
         let nameClass = column.className || "";
         if (column.prop == "NroSerie") {
            objRow[`${column.prop}`] = instance.getDataAtCell(column.row, column.col)
         }
         if (nameClass.includes("bgc")) {
            let color = nameClass.split("bgc_")[1].substring(0, 6)
            let objColumn = {
               name: column.prop,
               color
            }
            colors.push(objColumn)
         }
      })
      if (colors.length > 0) {
         objRow.colors = colors
         listColors.push(objRow)
      }
   }
   console.log(listColors)
}
//#endregion

//#region Eventos
//Obtiene todos los rows que se encuentran con cambios pendientes (Color = red).
const clickSaveAs = (instance) => {
   const btnSave = document.getElementById("btnSaveAs")
   btnSave.onclick = () => {
      getPendingChange(instance)
      getComments(instance)
      getRowsStyles(instance)

   }
}

//#endregion

//#region Configuracion del Table
//Setea la configuracion que va a requerir la tabla, OBLIGATORIO=>{elemento,settings}
const setConfiguration = () => {
   let data = [
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: "22/04/2020",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "True",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18-03-2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
      {
         SemPlanificLog: "26-5",
         Cliente: "METROPOLIS",
         NumeroObra: "tObr_ATM",
         ATM: "8296",
         SucDesc: "-",
         Direccion: "E. VIOLANTE 302",
         Localidad: "AMEGHINO",
         Provincia: "Buenos Aires",
         FechaEntrega: " ",
         HoraEntrega: "-",
         NroSerie: "0000000001",
         Modelo: "14259 2070 V",
         FechaRetiroDep: " ",
         DepositoOrigen: "Retirado",
         Gavetas_1: "-",
         SiMat: " ",
         Dificultad: "-",
         Lobby24hs: "False",
         Transporte: " ",
         NumeroPresupuesto: " ",
         Espera: " ",
         Capacitacion: " ",
         FechaInstalacion: "18/03/2020",
         HoraInstalacion: "-",
         FechaRevision: " ",
         HoraRevision: " ",
         Reemplazaal: "-",
         ModeloAcutal: "Traer a Virgilio",
         Observaciones_1:
            "Tiene que tener las perforaciones para que el clie…a con aro ya que es V. Kit de acrilico de camara.",
         Observaciones_2: "$100 - $200 - $500 y $1000",
         Observaciones_3: " ",
         CodigoOracle: "ATM.OPTEVA.5400040080",
         DescOracle: "ATM.OPTEVA.5400040080",
         AvisoDeposito: " ",
         AvisoCOT: " ",
         AvisoStaging: " ",
         CP: " ",
         DS: " ",
         NroSI: " ",
         AFacturar: " ",
         FacturarAdicional: " ",
         Consumo: " ",
      },
   ]
   let elements = document.querySelector("#puo");
   let settings = {
      data: data,
      columns: [
         { data: "SemPlanificLog", type: "text" },
         { data: "Cliente", type: "text" },
         { data: "NumeroObra", type: "text" },
         { data: "ATM", type: "text" },
         { data: "SucDesc", type: "text" },
         { data: "Direccion", type: "text" },
         { data: "Localidad", type: "text" },
         { data: "Provincia", type: "text" },
         { data: "FechaEntrega", type: "date", dateFormat: 'DD/MM/YYYY' },
         { data: "HoraEntrega", type: "text" },
         { data: "NroSerie", type: "text" },
         { data: "Modelo", type: "text" },
         { data: "FechaRetiroDep", type: "date", dateFormat: 'DD/MM/YYYY' },
         { data: "DepositoOrigen", type: "text" },
         { data: "Gavetas_1", type: "text" },
         { data: "SiMat", type: "text" },
         { data: "Dificultad", type: "text" },
         { data: "Lobby24hs", type: "checkbox" },
         { data: "Transporte", type: "text" },
         { data: "NumeroPresupuesto", type: "text" },
         { data: "Espera", type: "text" },
         { data: "Capacitacion", type: "text" },
         { data: "FechaInstalacion", type: "text" },
         { data: "HoraInstalacion", type: "text" },
         { data: "FechaRevision", type: "date", dateFormat: 'DD/MM/YYYY' },
         { data: "HoraRevision", type: "text" },
         { data: "Reemplazaal", type: "text" },
         { data: "ModeloAcutal", type: "text" },
         { data: "Observaciones_1", type: "text" },
         { data: "Observaciones_2", type: "text" },
         { data: "Observaciones_3", type: "text" },
         { data: "CodigoOracle", type: "text" },
         { data: "DescOracle", type: "text" },
         { data: "AvisoDeposito", type: "text" },
         { data: "AvisoCOT", type: "text" },
         { data: "AvisoStaging", type: "text" },
         { data: "CP", type: "text" },
         { data: "DS", type: "text" },
         { data: "NroSI", type: "text" },
         { data: "AFacturar", type: "text" },
         { data: "FacturarAdicional", type: "text" },
         { data: "Consumo", type: "text" },
      ],
      stretchH: "all",
      autoWrapRow: true,
      height: "95%",
      manualColumnMove: true,
      manualRowResize: true,
      manualColumnResize: true,
      rowHeaders: true,
      outsideClickDeselects: false,
      correctFormat: true,
      contextMenu: true,
      filters: true,
      dropdownMenu: true,
      language: "es-MX",
      comments: true,
      colHeaders: [
         "Semana",
         "Cliente",
         "Obra",
         "ATM",
         "Sucursal",
         "Direccion",
         "Localidad",
         "Provincia",
         "Fecha E",
         "Hora E",
         "Serie",
         "Modelo",
         "Retiro",
         "Deposito",
         "Gavetas",
         "SI Mat",
         "Dificultad",
         "Lobby",
         "Transporte",
         "Presupuesto",
         "Espera",
         "Capacitacion",
         "Fecha I",
         "Hora I",
         "Fecha R",
         "Hora R",
         "Reemplaza al",
         "ModeloAcutal",
         "Observaciones 1",
         "Observaciones 2",
         "Observaciones 3",
         "Codigo Articulo",
         "Descripcion",
         "Deposito",
         "COT",
         "Staging",
         "CP",
         "DS",
         "Si",
         "A facturar",
         "Facturar Adicional",
         "Consumo",
      ],
      nestedHeaders: nestedHeaders()
   };

   _dataObj = JSON.stringify(data)

   return { settings, elements }
}
/*Obtiene los Encabezados de cada conjunto de columnas. 
Ejemplo: 
  Entrega y Amure
Fecha E  | Hora E
*/
const nestedHeaders = () => {
   return [
      [
         {
            label: " ",
            colspan: 8,
         },
         {
            label: "Entrega y amure / Otro",
            colspan: 2,
         },
         {
            label: " ",
            colspan: 12,
         },
         {
            label: "Instalación técnica",
            colspan: 2,
         },
         {
            label: "Revisión en sucursal",
            colspan: 2,
         },
         {
            label: "Retiros",
            colspan: 2,
         },
         {
            label: " ",
            colspan: 5,
         },
         {
            label: "Avisos",
            colspan: 3,
         },
         {
            label: " ",
            colspan: 6,
         },
      ],
      [
         "Semana",
         "Cliente",
         "Obra",
         "ATM",
         "Sucursal",
         "Direccion",
         "Localidad",
         "Provincia",
         "Fecha E",
         "Hora E",
         "Serie",
         "Modelo",
         "Retiro",
         "Deposito",
         "Gavetas",
         "SI Mat",
         "Dificultad",
         "Lobby",
         "Transporte",
         "Presupuesto",
         "Espera",
         "Capacitacion",
         "Fecha I",
         "Hora I",
         "Fecha R",
         "Hora R",
         "Reemplaza al",
         "ModeloAcutal",
         "Observaciones 1",
         "Observaciones 2",
         "Observaciones 3",
         "Codigo Articulo",
         "Descripcion",
         "Deposito",
         "COT",
         "Staging",
         "CP",
         "DS",
         "Si",
         "A facturar",
         "Facturar Adicional",
         "Consumo",
      ],
   ]
}
//#endregion