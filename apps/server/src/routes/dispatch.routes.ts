import { Router, type Router as ExpressRouter } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createDispatch,
  getAvailableDNotes,
  getDispatchByNo,
  getDispatches,
  getDNoteByNo,
  submitPOD,
} from '../controllers/dispatch.controller.js';

const router: ExpressRouter = Router();

router.get('/', asyncHandler(getDispatches));
router.get('/dnotes', asyncHandler(getAvailableDNotes));
router.get('/dnotes/:dNoteNo', asyncHandler(getDNoteByNo));
router.get('/:dispatchNo', asyncHandler(getDispatchByNo));
router.post('/', asyncHandler(createDispatch));
router.post('/:dispatchNo/pod', asyncHandler(submitPOD));

export default router;
