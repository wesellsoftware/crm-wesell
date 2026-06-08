"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getCroppedImageBlob } from "@/lib/crop-image"

type AvatarCropDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string | null
  onConfirm: (blob: Blob) => void
  pending?: boolean
}

export function AvatarCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onConfirm,
  pending = false,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return

    setProcessing(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      onConfirm(blob)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-modal border-white/10 text-we-paper sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="font-display text-we-paper">Ajustar foto</DialogTitle>
          <DialogDescription className="font-body text-we-paper/50">
            Arraste e use o zoom para enquadrar sua foto no círculo.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full bg-black/40">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="px-5 py-3 space-y-2">
          <label className="font-body text-xs text-we-paper/50">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-we-green"
          />
        </div>

        <DialogFooter className="border-t border-white/[0.08] bg-white/[0.03] px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            className="text-we-paper/60 hover:text-we-paper hover:bg-white/5"
            onClick={() => handleOpenChange(false)}
            disabled={pending || processing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-we-blue text-white hover:bg-we-blue-deep"
            onClick={handleConfirm}
            disabled={pending || processing || !croppedAreaPixels}
          >
            {pending || processing ? "Salvando…" : "Usar foto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
