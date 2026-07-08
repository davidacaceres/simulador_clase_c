import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Resultado, RespuestaUsuario } from '../models/resultado.model';
// Formato/textos del certificado, editables en este JSON (se aplica al recompilar).
import cfg from '../data/certificado.config.json';

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

    let y = margen + 24;

    // Encabezado
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

    // Marca de reimpresión
    if (reimpresion) {
      y += 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setTxt(doc, col.incorrecta);
      const banner = cfg.reimpresionBanner
        .replace('{folio}', folio)
        .replace('{fecha}', this.fechaHora(reimpresion));
      doc.text(banner, W / 2, y, { align: 'center' });
    }

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
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setTxt(doc, col.suave);
    doc.text(`${et.numero}: ${folio}`, margen, y);
    doc.text(`${et.emitido}: ${this.fechaHora(emitido)}`, W - margen, y, { align: 'right' });
    y += 14;
    if (reimpresion) {
      setTxt(doc, col.incorrecta);
      doc.text(`${et.reimpreso}: ${this.fechaHora(reimpresion)}`, W - margen, y, { align: 'right' });
      setTxt(doc, col.suave);
      y += 12;
    }
    y += 8;

    // Tabla de detalle
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTxt(doc, col.texto);
    const cols = { n: margen, cod: margen + 40, sel: margen + 160, res: W - margen - 80 };
    doc.text(et.colNumero, cols.n, y);
    doc.text(et.colCodigo, cols.cod, y);
    doc.text(et.colSeleccion, cols.sel, y);
    doc.text(et.colResultado, cols.res, y);
    y += 6;
    doc.line(margen, y, W - margen, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    resultado.revision.forEach((rev, i) => {
      if (y > H - margen - 40) {
        doc.addPage();
        y = margen + 20;
      }
      setTxt(doc, col.texto);
      doc.text(String(i + 1), cols.n, y);
      doc.text(rev.pregunta.id, cols.cod, y);
      doc.text(this.formatoSeleccion(rev), cols.sel, y, { maxWidth: cols.res - cols.sel - 10 });
      if (rev.correcta) {
        setTxt(doc, col.correcta);
        doc.text(et.correcta, cols.res, y);
      } else {
        setTxt(doc, col.incorrecta);
        doc.text(rev.indicesElegidos.length ? et.incorrecta : et.sinResponder, cols.res, y);
      }
      y += 16;
    });

    // Aviso legal
    if (y > H - margen - 60) {
      doc.addPage();
      y = margen + 20;
    }
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margen, y, W - margen, y);
    y += 16;
    doc.setFontSize(8);
    setTxt(doc, col.suave);
    doc.text(doc.splitTextToSize(cfg.aviso, W - margen * 2), margen, y);

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
