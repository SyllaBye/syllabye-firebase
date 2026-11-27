import { useEffect, useRef, useState } from "react"

import PdfViewer from "./PdfViewer"
import DocxViewer from "./DocxViewer"

function SyllabusViewer({
    url,
    contentType,
    currentPageIndex,
    onPageCountChange,
    onClick
}) {
    const viewportRef = useRef(null)

    const [viewportSize, setViewportSize] = useState({
        width: 0,
        height: 0
    })

    // Measure available document viewport.
    useEffect(() => {
        if (!viewportRef.current) return

        const observer = new ResizeObserver(([entry]) => {
            setViewportSize({
                width: entry.contentRect.width,
                height: entry.contentRect.height
            })
        })

        observer.observe(viewportRef.current)

        return () => observer.disconnect()
    }, [])

    const viewerProps = {
        url,
        currentPageIndex,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        onPageCountChange,
        onClick
    }

    let viewer

    if (contentType === "application/pdf") {
        viewer = <PdfViewer {...viewerProps} />
    } else if (
        contentType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        viewer = <DocxViewer {...viewerProps} />
    } else {
        return <p>Unsupported format: {contentType}</p>
    }

    return (
        <div className="h-full w-full overflow-hidden p-3" ref={viewportRef}>
            {viewer}
        </div>
    )
}

export default SyllabusViewer