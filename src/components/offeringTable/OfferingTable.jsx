import { getOfferings } from "@/firebase/functions";
import { useEffect, useState, useRef } from "react";

import { Button } from "@/shadcn/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/shadcn/ui/table";
import { Skeleton } from "@/shadcn/ui/skeleton";

import OfferingTableRow from "./OfferingTableRow";
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

    const [loading, setLoading] = useState(true)

    const [offerings, setOfferings] = useState([])
    const [cursor, setCursor] = useState(null)
    const [hasMore, setHasMore] = useState(true)

    const [activeDialog, setActiveDialog] = useState(null)


    useEffect(() => {
        setOfferings([])
        setCursor(null)
        setHasMore(true)
        
        fetchOfferings()
    }, [statusKey, semesterKey, subjectKey, professorKey])

    async function loadMore() {
        if (hasMore && !loading) {
            fetchOfferings(cursor, offerings)
        }
    }

    async function fetchOfferings(currentCursor = null, prevOfferings = []) {
        const currentRequestId = ++requestId.current
        setLoading(true)

        console.log(statusKey, semesterKey, subjectKey, professorKey, currentCursor)

        try {
            const results = await getOfferings({
                cursor: currentCursor,
                filters: {
                    statusKey: statusKey,
                    semesterKey: semesterKey,
                    subjectKey: subjectKey,
                    professorKey: professorKey
                }
            })
            if (requestId.current === currentRequestId) {
                setOfferings([
                    ...prevOfferings,
                    ...results.data.offerings
                ])
                setCursor(results.data.cursor)
                setHasMore(results.data.hasMore)
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



    function openDialog(dialogOption, offering) {
        setActiveDialog({
            option: dialogOption,
            offering: offering
        })
    }

    function closeDialog() {
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
                            Array.from({ length: 20 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                                        <TableCell key={cellIndex}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            offerings.map((offering) => (
                                <OfferingTableRow 
                                    key={offering.id}
                                    offering={offering}
                                    onAction={openDialog}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>

                <Button
                    onClick={loadMore}
                    variant="outline"
                    disabled={!hasMore || loading}
                >
                    Load More
                </Button>
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