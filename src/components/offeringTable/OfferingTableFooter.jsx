import { useEffect, useState } from "react"

import { Button } from "@/shadcn/ui/button"
import { Input } from "@/shadcn/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shadcn/ui/select"
import { TableRow, TableCell } from "@/shadcn/ui/table"
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"


function OfferingTableFooter({ matchCount, currentPageIndex, totalPages, pageSize, onPageChange, onPageSizeChange }) {
    const [pageInput, setPageInput] = useState(String(currentPageIndex + 1))


    useEffect(() => {
        setPageInput(String(currentPageIndex + 1))
    }, [currentPageIndex])


    // Render JSX
    return (
        <TableRow>
            <TableCell colSpan={7}>
                <div className="flex items-center justify-between">
                    {/* Match count */}
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {matchCount.toLocaleString()} results total
                    </span>

                    {/* Page navigation */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPageChange(0)}
                            disabled={currentPageIndex === 0}
                            aria-label="First page"
                        >
                            <ChevronsLeft />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPageChange(currentPageIndex - 1)}
                            disabled={currentPageIndex === 0}
                            aria-label="Previous page"
                        >
                            <ChevronLeft />
                        </Button>

                        <div className="flex items-center gap-2">
                            <span>Page</span>
                            <Input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={matchCount > 0 ? pageInput : "0"}
                                onChange={(e) => {
                                    const value = e.target.value

                                    if (value === "" || /^\d+$/.test(value)) {
                                        setPageInput(value)
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const page = Number(pageInput)

                                        if (
                                            pageInput !== "" &&
                                            Number.isInteger(page) &&
                                            page >= 1 &&
                                            page <= totalPages
                                        ) {
                                            onPageChange(page - 1)
                                        } else {
                                            setPageInput(String(currentPageIndex + 1))
                                        }
                                    }
                                }}
                                onBlur={() => {
                                    setPageInput(String(currentPageIndex + 1))
                                }}
                                className="w-16 text-center"
                            />
                            <span>of {totalPages}</span>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPageChange(currentPageIndex + 1)}
                            disabled={currentPageIndex >= totalPages - 1}
                            aria-label="Next page"
                        >
                            <ChevronRight />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPageChange(totalPages - 1)}
                            disabled={currentPageIndex >= totalPages - 1}
                            aria-label="Last page"
                        >
                            <ChevronsRight />
                        </Button>
                    </div>

                    {/* Page size */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Rows per page
                        </span>

                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => onPageSizeChange(Number(value))}
                        >
                            <SelectTrigger className="w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    )
}


export default OfferingTableFooter