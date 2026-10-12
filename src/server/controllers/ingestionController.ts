import { Request, Response } from 'express';
import { IngestionService } from '../services/ingestionService';

export class IngestionController {
  static getSources(req: Request, res: Response) {
    try {
      const sources = IngestionService.getPermittedSources();
      return res.json({
        success: true,
        count: sources.length,
        data: sources,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  static async preview(req: Request, res: Response) {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'Target URL is required for preview.',
        });
      }

      const previewData = await IngestionService.previewFromUrl(url);
      return res.json({
        success: true,
        data: previewData,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to extract verified product data from URL.',
      });
    }
  }

  static async run(req: Request, res: Response) {
    try {
      const { sourceId, customUrl, categoryTag, pageSize } = req.body;

      if (sourceId?.startsWith('openbeautyfacts')) {
        let tag = 'foundations';
        if (sourceId.includes('concealers')) tag = 'concealers';
        if (sourceId.includes('powders')) tag = 'face-powders';

        const result = await IngestionService.runOpenBeautyFactsIngestion({
          categoryTag: categoryTag || tag,
          pageSize: pageSize ? Number(pageSize) : 10,
        });

        return res.status(201).json({
          success: true,
          message: `Successfully ingested ${result.items.length} verified products into MySQL from Open Beauty Facts.`,
          data: result,
        });
      }

      if (customUrl) {
        const result = await IngestionService.runWebPageIngestion(customUrl);
        return res.status(201).json({
          success: true,
          message: `Successfully ingested product "${result.item.productName}" into MySQL.`,
          data: result,
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Please provide either a valid permitted sourceId or customUrl.',
      });
    } catch (err: any) {
      console.error('Ingestion Run Error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Ingestion job execution failed.',
      });
    }
  }

  static async getJobs(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const jobs = await IngestionService.getJobHistory(limit);
      return res.json({
        success: true,
        count: jobs.length,
        data: jobs,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve ingestion jobs history.',
      });
    }
  }

  static async syncAll(req: Request, res: Response) {
    try {
      const { hubs } = req.body || {};
      const result = await IngestionService.runMultiHubSync(hubs);
      return res.status(200).json({
        success: true,
        message: `Successfully synchronized catalog across ${result.hubsScanned} premier brands and online hubs.`,
        data: result,
      });
    } catch (err: any) {
      console.error('Multi-Hub sync error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Multi-hub sync failed.',
      });
    }
  }
}
