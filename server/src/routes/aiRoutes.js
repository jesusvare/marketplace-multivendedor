const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * POST /api/ai/generate-image
 * Genera una imagen con Replicate (flux-schnell)
 * Solo vendedores y admins
 */
router.post(
  '/generate-image',
  protect,
  authorize('vendor', 'admin'),
  async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El prompt es requerido',
        });
      }

      const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
      if (!REPLICATE_TOKEN) {
        return res.status(500).json({
          success: false,
          message: 'Token de Replicate no configurado en el servidor',
        });
      }

      // Usar el SDK oficial de Replicate
      const Replicate = require('replicate');
      const replicate = new Replicate({
        auth: REPLICATE_TOKEN,
      });

      const enhancedPrompt = `Professional product photo of: ${prompt}. Clean white background, studio lighting, e-commerce style, high quality, 4k`;

      console.log('🎨 Generando imagen para:', prompt);

      const output = await replicate.run(
        'black-forest-labs/flux-schnell',
        {
          input: {
            prompt: enhancedPrompt,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'webp',
            output_quality: 90,
          },
        }
      );

      console.log('✅ Respuesta de Replicate:', output);

      // output puede ser un array de URLs o de ReadableStreams
      let imageUrl = null;

      if (Array.isArray(output) && output.length > 0) {
        const firstOutput = output[0];

        if (typeof firstOutput === 'string') {
          // Es una URL directa
          imageUrl = firstOutput;
        } else if (firstOutput instanceof ReadableStream || typeof firstOutput.read === 'function') {
          // Es un stream — convertir a base64 data URI
          const chunks = [];
          for await (const chunk of firstOutput) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          imageUrl = `data:image/webp;base64,${buffer.toString('base64')}`;
        }
      } else if (typeof output === 'string') {
        imageUrl = output;
      }

      if (!imageUrl) {
        console.error('Output inesperado de Replicate:', output);
        return res.status(500).json({
          success: false,
          message: 'No se pudo obtener la imagen generada',
        });
      }

      res.json({
        success: true,
        imageUrl,
        message: 'Imagen generada exitosamente',
      });

    } catch (error) {
      console.error('❌ Error en generación de imagen:', error.message || error);
      res.status(500).json({
        success: false,
        message: 'Error al generar imagen con IA',
        error: error.message,
      });
    }
  }
);

module.exports = router;