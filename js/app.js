const API_ADMIN = '/api';

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon} text-xl"></i><span class="text-sm font-medium tracking-wide">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const active = document.getElementById(sectionId);
    if (active) {
        active.classList.remove('hidden');
        active.classList.add('fade-in');
    }
    const footer = document.getElementById('main-footer');
    const nav = document.getElementById('main-nav');
    if (sectionId === 'dashboard') {
        if (footer) footer.classList.add('hidden');
        if (nav) nav.classList.add('hidden');
        cargarTablasDashboard();
    } else {
        if (footer) footer.classList.remove('hidden');
        if (nav) nav.classList.remove('hidden');
    }
    window.scrollTo(0, 0);
}

function showDashboardView(viewName) {
    document.querySelectorAll('.dash-view').forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('fade-in', 'block');
    });
    const target = document.getElementById('view-' + viewName);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('block', 'fade-in');
    }
    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.className = 'sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-semibold transition-all';
    });
    const activeBtn = document.getElementById('link-' + viewName);
    if (activeBtn) {
        activeBtn.className = 'sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-cyan text-white font-bold transition-all shadow-md';
    }
    const titles = {
        articulos: 'Control de Inventario (Tabla articulos)',
        proveedores: 'Gestión de Proveedores (Tabla proveedor)',
        clientes: 'Directorio de Clientes (Tabla cliente)',
        ventas: 'Historial de Ventas (Tabla ventas)',
        vehiculos: 'Control de Flotilla (Tabla vehiculos)',
        personal: 'Gestión de Personal (Tabla personal)'
    };
    const titleEl = document.getElementById('dash-title');
    if (titleEl) titleEl.innerText = titles[viewName] || 'Dashboard';

    cargarTablasDashboard();
}

async function cargarTablasDashboard() {
    try {
        const [resArt, resProv, resCli, resVen, resVeh, resPer] = await Promise.all([
            fetch(`${API_ADMIN}/articulos`),
            fetch(`${API_ADMIN}/proveedores`),
            fetch(`${API_ADMIN}/clientes`),
            fetch(`${API_ADMIN}/ventas`),
            fetch(`${API_ADMIN}/vehiculos`),
            fetch(`${API_ADMIN}/personal`)
        ]);

        const articulos = await resArt.json();
        const proveedores = await resProv.json();
        const clientes = await resCli.json();
        const ventas = await resVen.json();
        const vehiculos = await resVeh.json();
        const personal = await resPer.json();

        const tbodyArt = document.getElementById('tbody-articulos');
        if (tbodyArt) {
            tbodyArt.innerHTML = articulos.length
                ? articulos.map(a => `
                    <tr class="hover:bg-sky-50">
                        <td class="px-5 py-3 text-slate-400">#${a.id_articulos}</td>
                        <td class="px-5 py-3"><p class="font-bold text-slate-800">${a.desc1}</p><span class="text-xs text-slate-400">${a.desc2 || ''} (${a.categoria})</span></td>
                        <td class="px-5 py-3 text-center font-bold">${a.stock} <span class="text-xs font-normal text-slate-400">${a.unidad}</span></td>
                        <td class="px-5 py-3 text-right font-bold">$${parseFloat(a.precio_base).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td class="px-5 py-3 text-center"><span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Activo</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-400">Sin registros en la tabla articulos</td></tr>';
        }

        const tbodyProv = document.getElementById('tbody-proveedores');
        if (tbodyProv) {
            tbodyProv.innerHTML = proveedores.length
                ? proveedores.map(p => `
                    <tr class="hover:bg-sky-50">
                        <td class="px-5 py-3 text-slate-400">#${p.id_proveedor}</td>
                        <td class="px-5 py-3 font-bold text-slate-800">${p.razon_social}</td>
                        <td class="px-5 py-3">${p.nombre || '-'}</td>
                        <td class="px-5 py-3">${p.telefono || '-'}</td>
                        <td class="px-5 py-3 text-center"><span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Activo</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-400">Sin registros en la tabla proveedor</td></tr>';
        }

        const tbodyCli = document.getElementById('tbody-clientes');
        if (tbodyCli) {
            tbodyCli.innerHTML = clientes.length
                ? clientes.map(c => `
                    <tr class="hover:bg-teal-50/50">
                        <td class="px-5 py-3 text-slate-400">#${c.id_cliente}</td>
                        <td class="px-5 py-3 font-bold text-slate-800">${c.nombre} ${c.seg_nombre || ''} ${c.ap_pat} ${c.ap_mat || ''}</td>
                        <td class="px-5 py-3">${c.tel1}</td>
                        <td class="px-5 py-3">${c.email1 || '-'}</td>
                        <td class="px-5 py-3 text-center"><span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Activo</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-400">Sin registros en la tabla cliente</td></tr>';
        }

        const tbodyVen = document.getElementById('tbody-ventas');
        if (tbodyVen) {
            tbodyVen.innerHTML = ventas.length
                ? ventas.map(v => `
                    <tr class="hover:bg-green-50/50">
                        <td class="px-5 py-3 font-bold text-slate-800">${v.folio}</td>
                        <td class="px-5 py-3">${String(v.fecha_venta).slice(0, 10)}</td>
                        <td class="px-5 py-3">#${v.id_cliente} ${v.cliente_nombre ? '(' + v.cliente_nombre + ')' : ''}</td>
                        <td class="px-5 py-3 text-right font-bold text-green-700">$${parseFloat(v.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td class="px-5 py-3 text-center">${v.forma_pago}</td>
                        <td class="px-5 py-3 text-center"><span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Pagado</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="6" class="px-5 py-6 text-center text-slate-400">Sin registros en la tabla ventas</td></tr>';
        }

        const tbodyVeh = document.getElementById('tbody-vehiculos');
        if (tbodyVeh) {
            tbodyVeh.innerHTML = vehiculos.length
                ? vehiculos.map(vh => `
                    <tr class="hover:bg-blue-50/50">
                        <td class="px-5 py-3 text-slate-400">#${vh.id_vehiculos}</td>
                        <td class="px-5 py-3 font-bold text-slate-800">${vh.marca} ${vh.modelo} (${vh.anio})</td>
                        <td class="px-5 py-3"><span class="px-2 py-1 bg-slate-200 text-xs font-mono rounded">${vh.placa}</span></td>
                        <td class="px-5 py-3 text-brand-blue font-bold">${vh.capacidad} m3</td>
                        <td class="px-5 py-3 text-center"><span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Operativo</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-400">Sin registros en la tabla vehiculos</td></tr>';
        }

        const tbodyPer = document.getElementById('tbody-personal');
        if (tbodyPer) {
            tbodyPer.innerHTML = personal.length
                ? personal.map(pe => `
                    <tr class="hover:bg-indigo-50/50">
                        <td class="px-5 py-3 text-slate-400">#${pe.id_personal}</td>
                        <td class="px-5 py-3 font-bold text-slate-800">${pe.nombre} ${pe.ap_pat}</td>
                        <td class="px-5 py-3">${pe.puesto_nombre || 'Puesto #' + pe.id_puestos}</td>
                        <td class="px-5 py-3">${pe.tel || '-'}</td>
                        <td class="px-5 py-3 text-center"><span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">Activo</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" class="px-5 py-6 text-center text-slate-400">Sin registros en la tabla personal</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando tablas desde MySQL:', error);
    }
}