import { Request, Response } from 'express';
import { dbService } from '../services/db.service'; // Singleton instance

export const getPressureData = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await dbService.getPressureData();
    // Wrap the data in an object as per the original Go response structure
    res.status(200).json({ pressures: data });
  } catch (error) {
    console.error("API Error fetching pressure data:", error);
    res.status(500).json({ error: 'Failed to retrieve pressure data' });
  }
};

export const getMaterialData = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await dbService.getMaterialData();
        res.status(200).json({ materials: data });
    } catch (error) {
        console.error("API Error fetching material data:", error);
        res.status(500).json({ error: 'Failed to retrieve material data' });
    }
};

export const getFluidData = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await dbService.getFluidData();
        res.status(200).json({ fluids: data });
    } catch (error) {
        console.error("API Error fetching fluid data:", error);
        res.status(500).json({ error: 'Failed to retrieve fluid data' });
    }
};