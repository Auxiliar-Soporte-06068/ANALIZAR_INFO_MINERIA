const { chromium } = require('playwright');
const fs = require('fs').promises;
const HerramientaPath = require('path');

const obtenerFechaFormatoColombia = () => {
    const opciones = {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };

    const formateador = new Intl.DateTimeFormat('es-CO', opciones);
    const fechaActual = formateador.formatToParts(new Date());

    const partes = {};
    fechaActual.forEach(part => {
        if (part.type !== 'literal') partes[part.type] = part.value;
    });

    // Mapeo de los meses en texto abreviado
    const mesesAbreviados = [
        'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
        'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
    ];

    // Convertir el mes numérico al texto abreviado
    const mesTexto = mesesAbreviados[parseInt(partes.month, 10) - 1];
    
    // Crear la fecha actual
    const fecha = new Date(`${partes.year}-${partes.month}-${partes.day}`);
    // Sumar 7 días
    const fechaMaxima = new Date(fecha);
    fechaMaxima.setDate(fecha.getDate() + 7);
    // Restar días
    const FechaMinima = new Date(fecha);
    FechaMinima.setDate(fecha.getDate() - 7);

    let Fechas = {
        'FechaActual': `${partes.day}/${mesTexto}/${partes.year}`,
        'FechaMaxima': `${fechaMaxima.getDate()}/${mesesAbreviados[fechaMaxima.getMonth()]}/${fechaMaxima.getFullYear()}`,
        'FechaMinima': `${FechaMinima.getDate()}/${mesesAbreviados[FechaMinima.getMonth()]}/${FechaMinima.getFullYear()}`,
        'FechaNombreArchivo': `${partes.day}_${mesTexto}_${partes.year}`
    }
    // return `${partes.day}/${mesTexto}/${partes.year}`;
    return Fechas;
};

const ExtraerAnalizarInformacion = async() => {    
    const browser = await chromium.launch({
        headless: false, // Cambiar a true si no necesitas ver la UI para ahorrar recursos
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            // `--proxy-server=${proxy}`,
            '--start-maximized', // Maximiza la ventana
            '--no-sandbox', // Elimina la sobrecarga de seguridad (útil en entornos confiables)
            '--disable-extensions', // Desactiva extensiones
            '--disable-dev-shm-usage', // Evita problemas de espacio en /dev/shm en contenedores
            '--disable-background-timer-throttling', // Evita retrasos en tareas de fondo
            '--disable-backgrounding-occluded-windows', // No ralentizar ventanas en segundo plano
            '--disable-accelerated-2d-canvas', // Desactiva la aceleración 2D para liberar GPU
            // '--disable-gpu', // Desactiva GPU para liberar recursos si no es necesario renderizado gráfico
            '--enable-gpu',
            '--disable-software-rasterizer', // Evita uso de rasterización por software
            // '--blink-settings=imagesEnabled=false', // Bloquea imágenes para reducir ancho de banda
            '--disable-sync', // Desactiva sincronización del navegador
            '--disk-cache-size=0', // Desactiva caché en disco para evitar I/O innecesario
            '--disable-features=TranslateUI', // Desactiva traducción automática
            '--disable-features=IsolateOrigins,site-per-process', // Mejora la fluidez en sitios pesados
            '--enable-features=NetworkService,NetworkServiceInProcess', // Mejora manejo de red
            // '--window-size=1920,1080', // Configura el tamaño de la ventana para tareas específicas
            '--force-prefers-reduced-motion', // Reduce animaciones en sitios dinámicos
            '--no-zygote', // Reduce uso de procesos
            '--disable-infobars', // Oculta barras de información
            '--disable-notifications', // Desactiva notificaciones del navegador
            '--disable-popup-blocking', // Asegura que las ventanas emergentes se muestren si son necesarias
        ],
    });

    const context = await browser.newContext({
        viewport: null,
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
        // permissions: ['geolocation'],
        acceptDownloads: true, // Habilitar descargas
        downloadsPath: "C:\\Users\\HPGRIS\\Downloads\\", // Ruta de descarga personalizada
        bypassCSP: true,
        // userAgent: 'custom-user-agent', // OJOOOO ESTA CONFIGURACIÓN NO PERMITE LA DESCARGA DE LOS ARCHIVOS
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.87 Safari/537.36',
    });

    const page = await context.newPage();

    // Navegar a la página web
    await page.goto('https://annamineria.anm.gov.co/sigm/externalLogin');
    // const delayBetweenRequests = 1000; // 1 segundos entre solicitudes
    // await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));


    // Esperar a que el elemento sea visible
    await page.waitForSelector('img[src="views/img/icons/search_button.png"]', { state: 'visible' });

    // Hacer clic en el elemento
    await page.locator('img[src="views/img/icons/search_button.png"]').click();

    // Esperar a que el elemento <select> sea visible
    await page.waitForSelector('#publicSearchOptionsId', { state: 'visible' });

    // Seleccionar la opción deseada en el <select> usando el value
    await page.locator('#publicSearchOptionsId').selectOption({ value: 'sarSearchAreaReleases' });

    // Esperar a que el botón buscar esté visible
    await page.waitForSelector('#sta_link', {  state: 'visible' });

    // Hacer clic en el botón buscar
    await page.locator('#sta_link').click();

    // Esperar a que todos los resultados sean visibles
    await page.waitForSelector('input[placeholder="Fecha de publicación desde"]', { state: 'visible' });

    // Escribir la fecha de publicación desde
    const FechaActual = obtenerFechaFormatoColombia().FechaActual; //
    console.log(FechaActual);
    const FechaMinima = obtenerFechaFormatoColombia().FechaMinima;
    await page.locator('input[placeholder="Fecha de publicación desde"]').fill(FechaMinima);

    // Esperar
    await page.waitForSelector('input[placeholder="Fecha de liberación desde"]', { state: 'visible' });
    await page.locator('input[placeholder="Fecha de liberación desde"]').fill(FechaMinima);


    const FechaMaxima = obtenerFechaFormatoColombia().FechaMaxima;
    await page.waitForSelector('input[placeholder="Fecha de liberación hasta"]', { state: 'visible' });
    await page.locator('input[placeholder="Fecha de liberación hasta"]').fill(FechaMaxima);


    await page.waitForSelector('button[data-ng-click="searchClicked()"]');
    await page.locator('button[data-ng-click="searchClicked()"]').click();

    const ValorBuscar = `
									507886
								`;
    // Asegúrate de que la página esté completamente cargada
    await page.waitForSelector('#searchTblId');

    // Si hay un botón para mostrar más registros, haz clic en él hasta que no haya más registros
    while (await page.isVisible('selector_del_boton_mostrar_mas')) {
        await page.click('selector_del_boton_mostrar_mas');
        await page.waitForTimeout(1000); // Espera un segundo para que se carguen los nuevos registros
    }

    // Ahora que todos los registros están cargados, extrae los datos
    const tabla = page.locator('#searchTblId tbody');
    const numeroFilas = await tabla.locator('tr').count();
    console.log(`Número total de filas: ${numeroFilas}`);

    const datosTabla = [];


    // Esperamos boton para exportar pdf
    await page.waitForSelector('button[data-ng-click="exportToPdf()"]', { state: 'visible' });
    page.on('download', async (download) => {
        const path = await download.path(); // Ruta temporal del archivo
        const suggestedFilename = download.suggestedFilename(); // Nombre original del archivo
        const extension = suggestedFilename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf':
                console.log('El archivo es PDF');
            break;

            case 'xlsx':
                console.log('El archivo es Excel');
            break;
        }

        try {
            const downloadPath = HerramientaPath.join(__dirname, `./INFORMACION_CAPTURADA/${suggestedFilename}`);
            const newFilename = `Info_Tomada_El_${obtenerFechaFormatoColombia().FechaNombreArchivo}.${extension}`; // Nombre deseado
            const renamedPath = HerramientaPath.join(__dirname, `./INFORMACION_CAPTURADA/${newFilename}`);
            // Mover el archivo descargado a la ubicación deseada
            await download.saveAs(downloadPath);
        
            // Renombrar el archivo
            await fs.rename(downloadPath, renamedPath);
            console.log(`Archivo descargado y renombrado a: ${renamedPath}`);
        } catch (Error) {
            console.error(`Error al descargar archivo: ${Error}`);
            return;
        }
    });
    await page.locator('button[data-ng-click="exportToPdf()"]').click();


    // Espera a que se complete la descarga
    // await page.waitForTimeout(15000); // Ajusta el tiempo según sea necesario



    // Esperar a que se cargue el botón que descarga la información en Excel
    await page.waitForSelector('button[data-ng-click="exportToExcel()"]', { state: 'visible' });
    await page.locator('button[data-ng-click="exportToExcel()"]').click();
    // Muestra la información de la tabla
    console.log(datosTabla);

    // Extraer información (por ejemplo, el título de la página)
    const title = await page.title();
    console.log(`Título de la página: ${title}`);
    // Cerrar el navegador
    // await browser.close();
}

ExtraerAnalizarInformacion();