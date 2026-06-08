"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { Camera } from "lucide-react"
import { uploadAvatar } from "@/app/actions/settings"
import { AvatarCropDialog } from "@/components/avatar-crop-dialog"
import { cn } from "@/lib/utils"

type SidebarUserAvatarProps = {
  avatarUrl: string | null
  fullName: string
}

export function SidebarUserAvatar({ avatarUrl, fullName }: SidebarUserAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cropObjectUrlRef = useRef<string | null>(null)
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const initials = (fullName || "?").charAt(0).toUpperCase()

  useEffect(() => {
    setPreview(avatarUrl)
  }, [avatarUrl])

  useEffect(() => {
    return () => {
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current)
      }
    }
  }, [])

  function clearCropImage() {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current)
      cropObjectUrlRef.current = null
    }
    setCropImageSrc(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    clearCropImage()

    const objectUrl = URL.createObjectURL(file)
    cropObjectUrlRef.current = objectUrl
    setCropImageSrc(objectUrl)
    setCropOpen(true)

    e.target.value = ""
  }

  function handleCropConfirm(blob: Blob) {
    const localPreview = URL.createObjectURL(blob)
    setPreview(localPreview)

    const formData = new FormData()
    formData.set("avatar", new File([blob], "avatar.jpg", { type: "image/jpeg" }))

    startTransition(async () => {
      const result = await uploadAvatar(formData)
      if (result?.error) {
        setError(result.error)
        setPreview(avatarUrl)
      } else if (result?.avatarUrl) {
        setPreview(result.avatarUrl)
        setCropOpen(false)
        clearCropImage()
      }
      URL.revokeObjectURL(localPreview)
    })
  }

  function handleCropOpenChange(open: boolean) {
    setCropOpen(open)
    if (!open && !pending) {
      clearCropImage()
    }
  }

  return (
    <>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          title="Alterar foto de perfil"
          className={cn(
            "group relative block size-[44px] rounded-full border-2 border-we-green overflow-hidden",
            "bg-white/[0.08] transition-opacity hover:opacity-90",
            "focus:outline-none focus:ring-2 focus:ring-we-green/50 focus:ring-offset-1 focus:ring-offset-transparent",
            pending && "opacity-60 cursor-wait"
          )}
        >
          {preview ? (
            <Image
              src={preview}
              alt={fullName || "Foto de perfil"}
              fill
              className="object-cover"
              sizes="44px"
              unoptimized={preview.startsWith("blob:")}
            />
          ) : (
            <span className="flex size-full items-center justify-center font-body text-sm font-semibold text-we-paper/70">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={16} className="text-white" />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
        />
        {error && (
          <p className="absolute top-full left-0 mt-1 w-40 font-body text-[10px] text-we-red leading-tight">
            {error}
          </p>
        )}
      </div>

      <AvatarCropDialog
        open={cropOpen}
        onOpenChange={handleCropOpenChange}
        imageSrc={cropImageSrc}
        onConfirm={handleCropConfirm}
        pending={pending}
      />
    </>
  )
}
