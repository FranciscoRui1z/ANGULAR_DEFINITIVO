import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Empleado } from '../models/empleado.model';
import { Empresa } from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  constructor() {}

  /**
   * Exporta empleados a PDF
   */
  exportarEmpleadosAPDF(empleados: Empleado[], empresa?: Empresa): void {
    //Usa jsPDF para crear un PDF con los empleados. Try-catch atrapa errores.
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;  //Posición vertical inicial en la página.

      // Título del reporte
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Reporte de Empleados', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Información de la empresa (si existe)
      if (empresa) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        //Agrega datos de la empresa al PDF.
        doc.text(`Empresa: ${empresa.nombre}`, 20, yPosition);
        doc.text(`Ubicación: ${empresa.ciudad}, ${empresa.pais}`, 20, yPosition + 7);
        //toLocaleDateString convierte la fecha al formato español.
        doc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition + 14);
        yPosition += 30;
      }

      // Tabla de empleados - Encabezados
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      //Array con los nombres de las columnas.
      const headers = ['Nombre', 'Departamento', 'Puesto', 'Salario', 'Estado'];
      const headerY = yPosition;
      let xPosition = 20;  //Posición horizontal inicial.
      //Divide el ancho de la página entre el número de columnas.
      const columnWidth = (pageWidth - 40) / headers.length;

      // Fondo azul para los encabezados
      doc.setFillColor(0, 123, 255);
      doc.rect(20, headerY - 5, pageWidth - 40, 8, 'F');

      // Texto de encabezados en blanco
      doc.setTextColor(255, 255, 255);
      headers.forEach((header) => {
        doc.text(header, xPosition + 2, headerY);
        xPosition += columnWidth;
      });

      // Restablecer color de texto a negro
      doc.setTextColor(0, 0, 0);

      // Línea separadora
      doc.setDrawColor(0, 123, 255);
      doc.setLineWidth(0.5);
      doc.line(20, headerY + 4, pageWidth - 20, headerY + 4);

      doc.setFont('helvetica', 'normal');
      yPosition = headerY + 12;

      // Datos de empleados con alternancia de colores
      let rowColor = false;  //Bandera para alternar colores de filas.
      empleados.forEach((empleado) => {
        //Si llega al final de la página crea una nueva.
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
          rowColor = false;
        }

        // Alterna color de filas (gris claro)
        if (rowColor) {
          doc.setFillColor(240, 240, 240);
          doc.rect(20, yPosition - 5, pageWidth - 40, 7, 'F');
        }

        xPosition = 20;
        //Crea un array con los datos del empleado formateados.
        const fila = [
          `${empleado.nombre} ${empleado.apellido}`,
          empleado.departamento,
          empleado.puesto,
          //toLocaleString() formatea el número con separadores.
          `$${empleado.salario.toLocaleString()}`,
          empleado.estado
        ];

        fila.forEach((dato) => {
          const texto = String(dato);
          //splitTextToSize divide el texto si es muy largo.
          const lines = doc.splitTextToSize(texto, columnWidth - 4);
          doc.text(lines, xPosition + 2, yPosition, { maxWidth: columnWidth - 4 });
          xPosition += columnWidth;
        });

        yPosition += 8;
        rowColor = !rowColor;  //Alterna la bandera.
      });

      // Pie de página con total y fecha
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Total de empleados: ${empleados.length}`, 20, pageHeight - 10);
      //toLocaleString() formatea la fecha al estilo español.
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth - 80, pageHeight - 10);

      //Genera nombre único con timestamp para evitar sobrescribir archivos.
      const nombreArchivo = `reporte-empleados-${new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);
      console.log('✅ PDF exportado:', nombreArchivo);
    } catch (error) {
      console.error('❌ Error al exportar PDF:', error);
      throw error;
    }
  }

  /**
   * Exporta empleados a Excel
   */
  exportarEmpleadosAExcel(empleados: Empleado[], empresa?: Empresa): void {
    //Usa XLSX para crear un archivo de Excel con los empleados.
    try {
      //map() crea un nuevo array con los datos formateados para Excel.
      const datosParaExcel = empleados.map(emp => ({
        'Nombre': `${emp.nombre} ${emp.apellido}`,
        'Email': emp.email,
        'Teléfono': emp.telefono,
        'Departamento': emp.departamento,
        'Puesto': emp.puesto,
        'Salario': emp.salario,
        'Fecha Contratación': emp.fechaContratacion,
        'Estado': emp.estado
      }));

      //json_to_sheet convierte el array de objetos en una hoja de cálculo.
      const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);

      // Ajustar ancho de columnas para mejor visualización.
      const maxWidths = [20, 25, 15, 18, 20, 12, 18, 12];
      //!cols define el ancho de cada columna.
      worksheet['!cols'] = maxWidths.map(width => ({ wch: width }));

      //book_new crea un nuevo libro de Excel.
      const workbook = XLSX.utils.book_new();
      //book_append_sheet agrega la hoja "Empleados" al libro.
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados');

      // Agregar información de la empresa en una segunda hoja si existe.
      if (empresa) {
        //Crea un array de objetos con los datos de la empresa.
        const infoEmpresa = XLSX.utils.json_to_sheet([
          { Propiedad: 'Nombre', Valor: empresa.nombre },
          { Propiedad: 'Ubicación', Valor: `${empresa.ciudad}, ${empresa.pais}` },
          { Propiedad: 'Dirección', Valor: empresa.direccion },
          { Propiedad: 'Total Empleados', Valor: empresa.empleadosTotal },
          { Propiedad: 'Fecha Fundación', Valor: empresa.fechaFundacion }
        ]);
        //Agrega la hoja "Empresa" al mismo libro.
        XLSX.utils.book_append_sheet(workbook, infoEmpresa, 'Empresa');
      }

      //Genera nombre único con timestamp para el archivo de Excel.
      const nombreArchivo = `empleados-${new Date().getTime()}.xlsx`;
      //writeFile descarga el archivo en el navegador.
      XLSX.writeFile(workbook, nombreArchivo);
      console.log('✅ Excel exportado:', nombreArchivo);
    } catch (error) {
      console.error('❌ Error al exportar Excel:', error);
      throw error;
    }
  }

  /**
   * Genera estadísticas de empleados
   */
  generarEstadisticasEmpleados(empleados: Empleado[]): {
    //Calcula todas las estadísticas de los empleados como promedio, máximo, mínimo.
    totalEmpleados: number;
    salarioPromedio: number;
    salarioMax: number;
    salarioMin: number;
    departamentos: { [key: string]: number };
    porcentajePorDepartamento: { [key: string]: number };
    estados: { [key: string]: number };
    porcentajePorEstado: { [key: string]: number };
  } {
    const totalEmpleados = empleados.length;
    //map extrae solo los salarios de todos los empleados.
    const salarios = empleados.map(e => e.salario);
    //reduce suma todos los salarios, luego divide por cantidad para obtener promedio.
    const salarioPromedio = salarios.reduce((a, b) => a + b, 0) / totalEmpleados;
    //Math.max encuentra el salario más alto de todos.
    const salarioMax = Math.max(...salarios);
    //Math.min encuentra el salario más bajo de todos.
    const salarioMin = Math.min(...salarios);

    // Agrupar por departamento y contar cuántos empleados hay en cada uno.
    const departamentos: { [key: string]: number } = {};
    empleados.forEach(emp => {
      //Si el departamento ya existe suma 1, si no existe le asigna 1.
      departamentos[emp.departamento] = (departamentos[emp.departamento] || 0) + 1;
    });

    //Calcula el porcentaje de empleados en cada departamento.
    const porcentajePorDepartamento: { [key: string]: number } = {};
    Object.keys(departamentos).forEach(dept => {
      //Divide el número de empleados del departamento entre el total y multiplica por 100.
      porcentajePorDepartamento[dept] = (departamentos[dept] / totalEmpleados) * 100;
    });

    // Agrupar por estado (activo, inactivo, etc) y contar.
    const estados: { [key: string]: number } = {};
    empleados.forEach(emp => {
      estados[emp.estado] = (estados[emp.estado] || 0) + 1;
    });

    //Calcula el porcentaje de empleados en cada estado.
    const porcentajePorEstado: { [key: string]: number } = {};
    Object.keys(estados).forEach(estado => {
      porcentajePorEstado[estado] = (estados[estado] / totalEmpleados) * 100;
    });

    //Crea un objeto con todos los resultados de las estadísticas.
    const estadisticas = {
      totalEmpleados,
      //Math.round redondea el promedio a 2 decimales.
      salarioPromedio: Math.round(salarioPromedio * 100) / 100,
      salarioMax,
      salarioMin,
      departamentos,
      porcentajePorDepartamento,
      estados,
      porcentajePorEstado
    };

    console.log('✅ Estadísticas generadas:', estadisticas);
    //Devuelve el objeto con todas las estadísticas calculadas.
    return estadisticas;
  }

  /**
   * Genera un reporte HTML para visualización previa
   */
  generarReporteHTML(empleados: Empleado[], empresa?: Empresa): string {
    //Genera un HTML con formato profesional para visualizar o imprimir el reporte.
    //Primero calcula las estadísticas.
    const estadisticas = this.generarEstadisticasEmpleados(empleados);

    //Inicia la construcción del HTML con estilos CSS.
    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Empleados</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }

          h1 {
            color: #007bff;
            margin-bottom: 10px;
            text-align: center;
            font-size: 28px;
          }

          h2 {
            color: #0056b3;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 18px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 8px;
          }

          .header-info {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #007bff;
            margin-bottom: 20px;
            border-radius: 4px;
          }

          .header-info p {
            margin: 5px 0;
            font-size: 14px;
          }

          .stats {
            display: grid;
            //grid-template-columns crea 2 columnas iguales.
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
          }

          .stat-box {
            //Fondo degradado de azul.
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 20px;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            text-align: center;
          }

          .stat-box strong {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 8px;
            opacity: 0.9;
          }

          .stat-box div {
            font-size: 24px;
            font-weight: bold;
          }

          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          }

          th {
            background: #007bff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #0056b3;
          }

          td {
            border-bottom: 1px solid #ddd;
            padding: 12px;
            font-size: 13px;
          }

          //nth-child(even) selecciona las filas pares para color alterno.
          tr:nth-child(even) {
            background: #f9f9f9;
          }

          tr:hover {
            background: #f0f0f0;
          }

          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }

          //@media print define estilos específicos para la impresión.
          @media print {
            body { margin: 0; }
            .stats { grid-template-columns: 1fr 1fr; }
          }
        </style>
      </head>
      <body>
        <h1>📄 Reporte de Empleados</h1>
    `;

    //Si existe la empresa agrega su información al inicio del HTML.
    if (empresa) {
      html += `
        <div class="header-info">
          <p><strong>Empresa:</strong> ${empresa.nombre}</p>
          <p><strong>Ubicación:</strong> ${empresa.ciudad}, ${empresa.pais}</p>
          <p><strong>Dirección:</strong> ${empresa.direccion}</p>
          <p><strong>Fecha del reporte:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
      `;
    }

    //Agrega las estadísticas en cajas con colores.
    html += `
      <h2>📊 Estadísticas Generales</h2>
      <div class="stats">
        <div class="stat-box">
          <strong>Total de Empleados</strong>
          <div>${estadisticas.totalEmpleados}</div>
        </div>
        <div class="stat-box">
          <strong>Salario Promedio</strong>
          <div>$${estadisticas.salarioPromedio.toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <strong>Salario Máximo</strong>
          <div>$${estadisticas.salarioMax.toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <strong>Salario Mínimo</strong>
          <div>$${estadisticas.salarioMin.toLocaleString()}</div>
        </div>
      </div>

      <h2>👥 Detalle de Empleados</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Departamento</th>
            <th>Puesto</th>
            <th>Salario</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `;

    //Itera sobre cada empleado para agregar una fila en la tabla.
    empleados.forEach(emp => {
      //Define colores según el estado (verde activo, rojo inactivo, amarillo otro).
      const estadoColor = emp.estado === 'activo' ? '#28a745' : emp.estado === 'inactivo' ? '#dc3545' : '#ffc107';
      html += `
        <tr>
          <td><strong>${emp.nombre} ${emp.apellido}</strong></td>
          <td>${emp.email}</td>
          <td>${emp.departamento}</td>
          <td>${emp.puesto}</td>
          <td>$${emp.salario.toLocaleString()}</td>
          //Muestra el estado con color y un punto (●) de viñeta.
          <td><strong style="color: ${estadoColor};">● ${emp.estado.toUpperCase()}</strong></td>
        </tr>
      `;
    });

    //Cierra la tabla y agrega pie de página.
    html += `
        </tbody>
      </table>

      <div class="footer">
        <p>Documento generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
        <p>ANGULAR_DEFINITIVO © 2026</p>
      </div>
      </body>
      </html>
    `;

    //Devuelve el HTML completo como string.
    return html;
  }
}
