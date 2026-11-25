import { getSubjects } from '@/firebase/functions';
import { useEffect, useState, useMemo } from "react";

import { Combobox as ComboboxPrimitive } from "@base-ui/react"; 

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/shadcn/ui/combobox"
import { Skeleton } from "@/shadcn/ui/skeleton";


// selectionMode: "all" | "optional"
// "all"      - selecting the All option is allowed
// "optional" - selecting None is allowed

function SelectSubject({ value, onValueChange, selectionMode = "optional" }) {
    // Validate Props
    const validModes = ["all", "optional"];

    if (!validModes.includes(selectionMode)) {
        throw new Error(`Invalid selectionMode: ${selectionMode}`);
    }    
   
    // Component Logic
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)


    useEffect (() => {
        async function fetchSubjects() {
            try {
                const results = await getSubjects()
                setSubjects(results.data)
            } catch (error) {
                console.error("Failed to fetch subjects:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubjects()
    }, [])


    const sortedSubjects = useMemo(() => {
        return [...subjects].sort((a, b) => {
            return a.id.localeCompare(b.id)
        })
    }, [subjects])
    const items = useMemo( // Create Combobox items using subject id as values
        () => ComboboxPrimitive.createItems(sortedSubjects, {
            getValue: (subject) => subject.id,
            getLabel: (subject) => subject.id
        }),
        [sortedSubjects]
    )

    let placeholderText = ``;
    if (selectionMode === "all") {
        placeholderText = `All Subjects`;
    } else if (selectionMode === "optional") {
        placeholderText = `None`;
    }

    // Render JSX
    return (
        <Combobox
            items={items}
            value={value}
            onValueChange={onValueChange}
            filter={(subject, query) => {
                const search = query.toLowerCase().trim()
                return (
                    subject.id.toLowerCase().includes(search) ||
                    subject.fields.name.toLowerCase().includes(search)
                )
            }}
            autoHighlight
        >
            <ComboboxInput 
                className="h-10 w-64"
                placeholder={placeholderText} 
                showClear 
            />

            <ComboboxContent>
                {loading ? (
                    <div className="flex flex-col gap-2 p-2" role="status">
                        <span className="sr-only">Loading subjects...</span>
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-3/4" />
                    </div>
                ) : (
                    <>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>

                        <ComboboxList>
                            {(subject) => (
                                <ComboboxItem 
                                    key={subject.id} 
                                    value={subject.id}
                                    className="py-2"
                                >
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <span className="font-medium">
                                            {subject.id}
                                        </span>

                                        <span className="truncate text-xs text-muted-foreground">
                                            {subject.fields.name}
                                        </span>
                                    </div>
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </>
                )}
            </ComboboxContent>
        </Combobox>
    )
}

export default SelectSubject;