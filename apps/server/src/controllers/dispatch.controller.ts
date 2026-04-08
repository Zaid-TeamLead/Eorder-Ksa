import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import * as DispatchService from '../services/dispatch.service.js';

export const getDispatches = async (req: Request, res: Response) => {
  const dispatches = await DispatchService.getDispatchList({
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    dispatchNo: req.query.dispatchNo as string,
    dNoteNo: req.query.dNoteNo as string,
  });

  sendSuccess(res, dispatches);
};

export const getAvailableDNotes = async (req: Request, res: Response) => {
  const dnotes = await DispatchService.getAvailableDNotes({
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    dNoteNo: req.query.dNoteNo as string,
    search: req.query.search as string,
  });

  sendSuccess(res, dnotes);
};

export const getDNoteByNo = async (req: Request, res: Response) => {
  const detail = await DispatchService.getDNoteByNo(req.params.dNoteNo || '');
  sendSuccess(res, detail);
};

export const getDispatchByNo = async (req: Request, res: Response) => {
  const detail = await DispatchService.getDispatchByNo(req.params.dispatchNo || '');
  sendSuccess(res, detail);
};

export const createDispatch = async (req: Request, res: Response) => {
  const created = await DispatchService.createDispatch({
    ...req.body,
    logUserId: req.user?.SlpCode || req.user?.name || 'SYSTEM',
    logUserName: req.user?.name || req.user?.SlpCode || 'SYSTEM',
  });

  sendSuccess(res, created, 201);
};

export const submitPOD = async (req: Request, res: Response) => {
  const result = await DispatchService.submitPODByDispatchNo(
    req.params.dispatchNo || '',
    req.body,
    (req.user?.SlpCode || req.user?.name || 'SYSTEM').toString(),
    req.user?.name || req.user?.SlpCode || 'SYSTEM'
  );

  sendSuccess(res, result);
};
