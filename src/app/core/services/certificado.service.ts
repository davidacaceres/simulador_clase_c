import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Resultado, RespuestaUsuario } from '../models/resultado.model';
// Formato/textos del certificado, editables en este JSON (se aplica al recompilar).
import cfg from '../data/certificado.config.json';
// Timbre de aprobación (imagen base64) que se estampa en el certificado.
import { TIMBRE_APROBADO } from '../data/timbre.data';

/** Datos del postulante para el certificado. */
export interface DatosCertificado {
  nombre: string;
  correo: string;
}

/** Opciones para generar el PDF del certificado. */
export interface OpcionesCertificado {
  datos: DatosCertificado;
  resultado: Resultado;
  /** Folio / código del certificado (el original, incluso al reimprimir). */
  folio: string;
  /** Fecha de emisión ORIGINAL del certificado. */
  emitido: Date;
  /** Si viene, es una reimpresión; su valor es la fecha/hora de la reimpresión. */
  reimpresion?: Date;
}

/**
 * Genera un certificado digital en PDF (en el navegador, sin backend) al aprobar
 * el Modo Examen. Incluye nombre, correo, puntaje, fecha/hora de emisión, un folio
 * y el detalle de cada pregunta con la selección del postulante.
 */
@Injectable({ providedIn: 'root' })
export class CertificadoService {
  private readonly letras = ['A', 'B', 'C', 'D', 'E', 'F'];
  /** Número de WhatsApp de Conducir Motos (formato internacional sin +). */
  private readonly whatsapp = '56991206186';

  /**
   * Abre el chat de WhatsApp de Conducir Motos con un mensaje listo referenciando
   * el certificado. NOTA: por seguridad, el navegador/WhatsApp NO permiten adjuntar
   * el archivo automáticamente; el usuario adjunta el PDF descargado manualmente.
   */
  abrirWhatsApp(folio: string, puntaje: number, puntajeMaximo: number): void {
    const msg =
      `Hola Conducir Motos 🏍️. Aprobé el examen teórico del simulador Clase C.\n` +
      `Certificado N° ${folio} — ${puntaje}/${puntajeMaximo} puntos.\n` +
      `Adjunto el PDF del certificado.`;
    const url = `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  generar(opciones: OpcionesCertificado): void {
    const { datos, resultado, folio, emitido, reimpresion } = opciones;
    const et = cfg.etiquetas;
    const col = cfg.colores;
    const setTxt = (doc: jsPDF, c: number[]) => doc.setTextColor(c[0], c[1], c[2]);
    const setLin = (doc: jsPDF, c: number[]) => doc.setDrawColor(c[0], c[1], c[2]);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margen = 40;

    // Marco
    setLin(doc, col.primario);
    doc.setLineWidth(2);
    doc.rect(margen / 2, margen / 2, W - margen, H - margen);

    let y = margen + 4;

    // Encabezado de página: N° certificado (izq) y fecha de emisión (der)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTxt(doc, col.suave);
    doc.text(`${et.numero}: ${folio}`, margen, y);
    doc.text(`${et.emitido}: ${this.fechaHora(emitido)}`, W - margen, y, { align: 'right' });
    y += 24;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    setTxt(doc, col.primario);
    doc.text(cfg.titulo, W / 2, y, { align: 'center' });
    y += 22;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    setTxt(doc, col.suave);
    doc.text(cfg.subtitulo, W / 2, y, { align: 'center' });
    y += 14;
    doc.text(cfg.organizacion, W / 2, y, { align: 'center' });

    // Línea
    y += 18;
    setLin(doc, col.acento);
    doc.setLineWidth(1.5);
    doc.line(margen, y, W - margen, y);
    y += 30;

    // Cuerpo
    setTxt(doc, col.texto);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(cfg.cuerpo, W - margen * 2), margen, y);
    y += 40;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(datos.nombre, margen, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    setTxt(doc, col.suave);
    doc.text(datos.correo, margen, y);
    y += 26;

    // Puntaje
    setTxt(doc, col.primario);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(
      `${et.puntaje}: ${resultado.puntaje} / ${resultado.puntajeMaximo}  ·  ${et.resultado}`,
      margen,
      y,
    );
    y += 22;

    // Tabla de detalle en DOS columnas (para que las 35 preguntas quepan en una página)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    const total = resultado.revision.length;
    const mitad = Math.ceil(total / 2);
    const colGap = 20;
    const anchoCol = (W - 2 * margen - colGap) / 2;
    const xL = margen;
    const xR = margen + anchoCol + colGap;
    const off = { n: 0, cod: 20, sel: 68, res: anchoCol - 52 };
    const rowH = 15;

    // Cabecera de ambas columnas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTxt(doc, col.texto);
    for (const xBase of [xL, xR]) {
      doc.text(et.colNumero, xBase + off.n, y);
      doc.text(et.colCodigo, xBase + off.cod, y);
      doc.text(et.colSeleccion, xBase + off.sel, y);
      doc.text(et.colResultado, xBase + off.res, y);
    }
    y += 5;
    doc.line(margen, y, W - margen, y);
    const tablaTop = y + 12;

    doc.setFont('helvetica', 'normal');
    resultado.revision.forEach((rev, i) => {
      const enSegunda = i >= mitad;
      const xBase = enSegunda ? xR : xL;
      const fila = enSegunda ? i - mitad : i;
      const yRow = tablaTop + fila * rowH;
      setTxt(doc, col.texto);
      doc.text(String(i + 1), xBase + off.n, yRow);
      doc.text(rev.pregunta.id, xBase + off.cod, yRow);
      doc.text(this.formatoSeleccion(rev), xBase + off.sel, yRow, { maxWidth: off.res - off.sel - 6 });
      if (rev.correcta) {
        setTxt(doc, col.correcta);
        doc.text(et.correcta, xBase + off.res, yRow);
      } else {
        setTxt(doc, col.incorrecta);
        doc.text(rev.indicesElegidos.length ? et.incorrecta : et.sinResponder, xBase + off.res, yRow);
      }
    });
    y = tablaTop + mitad * rowH + 4;

    // Aviso legal
    if (y > H - margen - 60) {
      doc.addPage();
      y = margen + 20;
    }
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margen, y, W - margen, y);
    y += 16;
    // Aviso a la izquierda para dejar espacio al timbre a la derecha
    doc.setFontSize(8);
    setTxt(doc, col.suave);
    doc.text(doc.splitTextToSize(cfg.aviso, W - margen * 2 - 150), margen, y);

    // Timbre de aprobación (esquina inferior derecha) con enlace a la web
    const timbre = 130;
    const tx = W - margen - timbre;
    const ty = H - margen - timbre;
    try {
      doc.addImage(TIMBRE_APROBADO, 'PNG', tx, ty, timbre, timbre);
      if (cfg.timbreEnlace) {
        doc.link(tx, ty, timbre, timbre, { url: cfg.timbreEnlace });
      }
    } catch {
      /* si el timbre no está disponible, se omite */
    }

    // Pie de página: aviso de reimpresión (único lugar donde se indica)
    if (reimpresion) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setTxt(doc, col.incorrecta);
      const banner = cfg.reimpresionBanner
        .replace('{folio}', folio)
        .replace('{fecha}', this.fechaHora(reimpresion));
      doc.text(banner, W / 2, H - margen / 2 - 8, { align: 'center' });
    }

    doc.save(`${cfg.nombreArchivo}-${folio}.pdf`);
  }

  /** Formatea la selección del postulante según el tipo de pregunta. */
  private formatoSeleccion(rev: RespuestaUsuario): string {
    if (rev.indicesElegidos.length === 0) return '—';
    if (rev.pregunta.tipo === 'emparejamiento') {
      const items = rev.pregunta.items ?? [];
      return items
        .map((it, k) => {
          const idx = rev.indicesElegidos[k];
          return `${it.etiqueta}→${idx >= 0 ? this.letras[idx] ?? '?' : '—'}`;
        })
        .join('  ');
    }
    return rev.indicesElegidos.map((i) => this.letras[i] ?? '?').join(', ');
  }

  /**
   * Código ÚNICO identificable del certificado (sin backend, no secuencial):
   * formato CERT-AAAAMMDD-XXXXXXXX (fecha + segmento aleatorio).
   * Un correlativo secuencial real requeriría un contador central (backend).
   */
  generarFolio(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    const fecha = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
    let rand: string;
    try {
      rand = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    } catch {
      rand = (Date.now().toString(36) + Math.random().toString(36).slice(2))
        .toUpperCase()
        .slice(0, 8);
    }
    return `CERT-${fecha}-${rand}`;
  }

  private fechaHora(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(
      d.getMinutes(),
    )}`;
  }
}
