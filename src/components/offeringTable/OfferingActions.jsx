import { Button } from "@/shadcn/ui/button";
import { Mail, Upload, Eye, Pencil } from "lucide-react";


function OfferingActions({ selectDialogOption, hovering = false }) {
    return (
        <div className="
            inline-flex w-fit items-center justify-end gap-1
            rounded-lg border
            bg-muted/10
            p-1
            transition-colors duration-200
            group-hover:bg-muted
        ">
            <Button
                variant={hovering ? "default" : "outline"}
                size="icon"
                className="transition-all duration-300 ease-in-out hover:scale-105"
                title="Send reminder"
                onClick={() => selectDialogOption("email")}
            >
                <Mail className="h-4 w-4" />
            </Button>

            <Button
                variant={hovering ? "default" : "outline"}
                size="icon"
                className="transition-all duration-300 ease-in-out hover:scale-105"
                title="Upload syllabus"
                onClick={() => selectDialogOption("upload")}
            >
                <Upload className="h-4 w-4" />
            </Button>

            <Button
                variant={hovering ? "default" : "outline"}
                size="icon"
                className="transition-all duration-300 ease-in-out hover:scale-105"
                title="View syllabus"
                onClick={() => selectDialogOption("view")}
            >
                <Eye className="h-4 w-4" />
            </Button>

            <Button
                variant={hovering ? "default" : "outline"}
                size="icon"
                className="transition-all duration-300 ease-in-out hover:scale-105"
                title="Edit offering"
                onClick={() => selectDialogOption("edit")}
            >
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
    );
}

export default OfferingActions;