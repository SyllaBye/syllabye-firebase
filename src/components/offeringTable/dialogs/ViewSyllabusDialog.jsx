import { useEffect, useState } from "react"

import { ref, listAll, getDownloadURL, getMetadata, getBlob } from "firebase/storage"
import { storage } from "@/firebase/firebase"
import { generateSyllabusFilename } from "@/utils/offeringUtils"

import { Button } from "@/shadcn/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shadcn/ui/dialog"
import { ChevronLeft, ChevronRight, Download, LoaderCircle, FileWarning } from "lucide-react"

import SyllabusViewer from "./components/SyllabusViewer"


function ViewSyllabusDialog({ offering, onClose }) {
    const [syllabus, setSyllabus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [pageCount, setPageCount] = useState(0)
    const [currentPageIndex, setCurrentPageIndex] = useState(0)

    const [introAnimation, setIntroAnimation] = useState(true)


    // Load the syllabus from Firebase
    useEffect(() => {
        async function fetchSyllabus() {
            setLoading(true)
            setError(null)

            try {
                const folderRef = ref(
                    storage,
                    `offerings/${offering.id}`
                )

                const result = await listAll(folderRef)
                const fileRef = result.items[0]

                if (!fileRef) {
                    setSyllabus(null)
                    return
                }

                const [url, metadata, blob] = await Promise.all([
                    getDownloadURL(fileRef),
                    getMetadata(fileRef),
                    getBlob(fileRef)
                ])

                setSyllabus({
                    url,
                    contentType: metadata.contentType,
                    name: metadata.name,
                    blob
                })
            } catch (error) {
                console.error("Failed to fetch syllabus:", error)
                setError("Failed to load syllabus.")
            } finally {
                setLoading(false)
            }
        }

        fetchSyllabus()
    }, [offering.id])

    // Download the individual Syllabus
    function handleDownload() {
        const url = URL.createObjectURL(syllabus.blob)
        const link = document.createElement("a")

        link.href = url
        link.download = generateSyllabusFilename(offering)

        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    // Reset pagination when the document changes.
    useEffect(() => {
        setCurrentPageIndex(0)
        setPageCount(0)
    }, [syllabus?.url, syllabus?.contentType])

    // Disable intro animation
    useEffect(() => {
        if (currentPageIndex != 0) {
            setIntroAnimation(false)
        }
    }, [currentPageIndex])


    // Render JSX
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="flex h-[80dvh] flex-col w-200! max-w-[95%]! min-w-0">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>View Syllabus</DialogTitle>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                            <div className="text-center">
                                <p className="font-medium text-foreground">Loading syllabus</p>
                                <p className="text-sm">Please wait while the document loads.</p>
                            </div>
                        </div>
                    ) : error || !syllabus ? (
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <FileWarning className="h-8 w-8 text-destructive" />
                            <div className="text-center">
                                <p className="font-medium text-foreground">
                                    {error ? "Unable to load syllabus" : "Syllabus not found"}
                                </p>
                                <p className="text-sm">
                                    {error
                                        ? "An error occurred while retrieving the syllabus. Please try again later."
                                        : "The syllabus could not be found. No syllabus exists."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <SyllabusViewer
                            url={syllabus.url}
                            contentType={syllabus.contentType}
                            currentPageIndex={currentPageIndex}
                            onPageCountChange={setPageCount}
                            onClick={() => {
                                if (pageCount > 0) {
                                    setCurrentPageIndex(index =>
                                        Math.min(index + 1, pageCount - 1)
                                    )
                                }
                            }}
                        />
                    )}
                </div>

                {!error && (syllabus || (loading && !syllabus)) && (
                    <DialogFooter className="relative flex-row items-center justify-between h-10 p-3">
                        <div className="flex flex-1 justify-start">
                            <Button variant="outline" disabled={pageCount===0} onClick={handleDownload}>
                                <Download />
                                Download
                            </Button>
                        </div>

                        {!error && (
                            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4">
                                <Button
                                    variant="outlined"
                                    disabled={currentPageIndex === 0}
                                    onClick={() => setCurrentPageIndex(index => index - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <span className="text-sm text-muted-foreground select-none">
                                    {pageCount === 0 ? 0 : currentPageIndex + 1} / {pageCount}
                                </span>

                                <Button
                                    className={introAnimation ? "animate-pulse" : ""}
                                    onMouseEnter={() => setIntroAnimation(false)}
                                    variant="outlined"
                                    disabled={pageCount === 0 || currentPageIndex >= pageCount - 1}
                                    onClick={() => setCurrentPageIndex(index => index + 1)}
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default ViewSyllabusDialog