import { useEffect } from "react"

interface SEOProps {
  title: string
  description?: string
}

export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title ? `${title} | Zynqro ` : "Zynqro "

    let metaDescription = document.querySelector('meta[name="description"]')
    let created = false

    if (description) {
      if (!metaDescription) {
        metaDescription = document.createElement("meta")
        metaDescription.setAttribute("name", "description")
        document.head.appendChild(metaDescription)
        created = true
      }
      metaDescription.setAttribute("content", description)
    }

    return () => {
      document.title = prevTitle
      if (metaDescription && created) {
        document.head.removeChild(metaDescription)
      }
    }
  }, [title, description])
}
