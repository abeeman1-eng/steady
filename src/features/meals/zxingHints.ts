import { BarcodeFormat, DecodeHintType } from '@zxing/library'

/** Retail barcodes only, with ZXing's slower but much more thorough "try harder" mode. */
export function zxingHints(): Map<DecodeHintType, unknown> {
  return new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
    [DecodeHintType.TRY_HARDER, true],
  ])
}
