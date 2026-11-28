import { getOfferings } from "@/firebase/functions";
import { useEffect, useState, useRef } from "react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/shadcn/ui/table";
import { Skeleton } from "@/shadcn/ui/skeleton";

import OfferingTableRow from "./OfferingTableRow";
import OfferingTableFooter from "./OfferingTableFooter";
import OfferingDialog from "./dialogs/OfferingDialog";



function OfferingTable({filters = {}}) {
    // Read Filters
    const {
        statusKey = null,
        semesterKey = null, 
        subjectKey = null,
        professorKey = null
    } = filters


    // Component Logic
    const requestId = useRef(0)

    const [initialLoading, setInitialLoading] = useState(true)   // True if the contents of a new query are still loading in
    const [loading, setLoading] = useState(true)                 // True if the contents of the current page are still loading in

    const [offerings, setOfferings] = useState([])               // All of the offerings for the matching the given filters we have saved so far            
    const [cursor, setCursor] = useState(null)                   // Pagination cursor. Used to query for the next page

    const [currentPageIndex, setCurrentPageIndex] = useState(0)  // The index of the currently displayed page 
    const [pageSize, setPageSize] = useState(10)                 // How many offerings to display per page
    const [matchCount, setMatchCount] = useState(0)              // The number of offerings matching the given filters

    const [activeDialog, setActiveDialog] = useState(null)       // Info about what OfferingTable dialog (if any) is currently open

    const totalPages = Math.ceil(matchCount / pageSize)


    useEffect(() => {
        setOfferings([])
        setCursor(null)
        setMatchCount(0)
        setCurrentPageIndex(0)
        
        setInitialLoading(true)
    }, [statusKey, semesterKey, subjectKey, professorKey])

    useEffect(() => {
        async function goToPage() {
            if (currentPageIndex < 0) {return} // invalid page index

            const totalLoaded = offerings.length
            const firstOfferingIndex = currentPageIndex * pageSize
            const lastOfferingIndex = firstOfferingIndex + (pageSize - 1)

            if (lastOfferingIndex >= totalLoaded) // we need to query the database for more offerings
            {
                const fetchCount = (lastOfferingIndex + 1 - totalLoaded)
                await fetchOfferings(cursor, offerings, fetchCount)
            }
            setInitialLoading(false)
        }

        console.log(currentPageIndex, pageSize)

        goToPage()
    }, [currentPageIndex, pageSize, initialLoading])


    async function fetchOfferings(currentCursor = null, prevOfferings = [], fetchCount = 10) {
        const currentRequestId = ++requestId.current
        setLoading(true)

        try {
            const results = await getOfferings({
                cursor: currentCursor,
                filters: {
                    statusKey: statusKey,
                    semesterKey: semesterKey,
                    subjectKey: subjectKey,
                    professorKey: professorKey
                },
                pageSize: fetchCount
            })
            if (requestId.current === currentRequestId) {
                setOfferings([
                    ...prevOfferings,
                    ...results.data.offerings
                ])
                setCursor(results.data.cursor)
                setMatchCount(results.data.totalCount)
            }
        } catch (error) {
            if (requestId.current === currentRequestId) {
                console.error("Failed to fetch offerings:", error)
            }
        } finally {
            if (requestId.current === currentRequestId) {
                setLoading(false)
            }
        }
    }


    function openDialog(dialogOption, offering, offeringIndex) {
        setActiveDialog({
            option: dialogOption,
            offering: offering,
            offeringIndex: offeringIndex
        })
    }

    function closeDialog(updatedOffering = null) {
        // update the list of offerings if the dialog updated the offering
        if (updatedOffering) {
            let updatedOfferings = offerings
            updatedOfferings[activeDialog.offeringIndex] = updatedOffering
            setOfferings(updatedOfferings)
        }

        // close the dialog
        setActiveDialog(null)
    }


    // Render JSX
    return (
        <>
            <div className="overflow-x-auto">
                <Table className="w-full max-w-[1600px] min-w-[700px] border-collapse">
                    <colgroup>
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[calc(40%-180px)]" />
                        <col className="w-[12%]" />
                        <col className="w-[180px]" />
                    </colgroup>

                    <TableHeader className="bg-muted/75">
                        <TableRow>
                            <TableHead>Semester</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Course Number</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Professor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            Array.from({ length: ((Math.min(((currentPageIndex + 1) * pageSize), matchCount) - (currentPageIndex * pageSize)) || pageSize) }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="h-15">
                                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                                        <TableCell key={cellIndex}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : offerings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="font-medium">No offerings found</span>
                                        <span className="text-sm text-muted-foreground">
                                            No offerings match the selected filters.
                                            Try adjusting or clearing your filters.
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            offerings.slice((currentPageIndex * pageSize), ((currentPageIndex + 1) * pageSize))
                            .map((offering, index) => (
                                <OfferingTableRow 
                                    key={offering.id}
                                    offering={offering}
                                    selectDialogOption={(dialogOption) => (
                                        openDialog(dialogOption, offering, ((currentPageIndex * pageSize) + index))
                                    )}
                                />
                            ))
                        )}
                    </TableBody>

                    <TableFooter>
                        <OfferingTableFooter
                            matchCount={matchCount}
                            currentPageIndex={currentPageIndex}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            onPageChange={setCurrentPageIndex}
                            onPageSizeChange={(newPageSize) => {
                                setPageSize(newPageSize)
                                setCurrentPageIndex(0)
                            }}
                        />
                    </TableFooter>
                </Table>
            </div>

            {activeDialog && (
                <OfferingDialog
                    option={activeDialog.option}
                    offering={activeDialog.offering}
                    onClose={closeDialog}
                />
            )}
        </>
    )
}


export default OfferingTable;