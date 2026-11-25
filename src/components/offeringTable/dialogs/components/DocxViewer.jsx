import { useEffect, useRef, useState } from "react"
import { renderAsync } from "docx-preview"

function DocxViewer({
    url,
    currentPageIndex,
    viewportWidth,
    viewportHeight,
    onPageCountChange,
    onClick
}) {
    const containerRef = useRef(null)
    const pagesRef = useRef([])


    // Calculate page scale, accounting for the surrounding padding.
    const pageScale = Math.min(
        1,
        viewportWidth > 0 ? Math.max(0, viewportWidth - 24) / 816 : 1,
        viewportHeight > 0 ? Math.max(0, viewportHeight - 24) / 1056 : 1
    )

    // Fetch and render DOCX.
    useEffect(() => {
        const controller = new AbortController()

        async function loadDocument() {
            pagesRef.current = []
            onPageCountChange(0)

            try {
                const response = await fetch(url, {
                    signal: controller.signal
                })

                if (!response.ok) {
                    throw new Error("Failed to fetch DOCX")
                }

                const data = await response.arrayBuffer()

                if (controller.signal.aborted) return

                containerRef.current.innerHTML = ""

                await renderAsync(
                    data,
                    containerRef.current,
                    containerRef.current,
                    {
                        breakPages: true,
                        ignoreLastRenderedPageBreak: false,
                        pageWidth: 12240,
                        pageHeight: 15840
                    }
                )

                if (controller.signal.aborted) return

                pagesRef.current = Array.from(
                    containerRef.current.querySelectorAll("section.docx")
                )

                onPageCountChange(pagesRef.current.length)
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Failed to render DOCX:", error)
                    onPageCountChange(0)
                }
            }
        }

        loadDocument()

        return () => {
            controller.abort()
            pagesRef.current = []

            if (containerRef.current) {
                containerRef.current.innerHTML = ""
            }
        }
    }, [url, onPageCountChange])

    // Display and scale selected page.
    useEffect(() => {
        pagesRef.current.forEach((page, index) => {
            page.style.display = index === currentPageIndex ? "" : "none"
            page.style.zoom = pageScale
        })
    }, [currentPageIndex, pageScale])


    // Render JSX
    return (
        <div className="flex min-h-full min-w-full items-center justify-center">
            <style>
                {`
                    .docx-wrapper {
                        padding: 12px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        background: none !important;
                    }

                    .docx-wrapper > section.docx {
                        margin: 0 !important;
                        outline: none !important;
                        border: none !important;
                        box-shadow: var(--shadow-md) !important;
                        cursor: ${currentPageIndex < pagesRef.current.length - 1 ? "pointer" : "default"};
                    }
                `}
            </style>

            <div
                ref={containerRef}
                onClick={event => {
                    if (event.target.closest("section.docx")) {
                        onClick?.()
                    }
                }}
            />
        </div>
    )
}

export default DocxViewer
