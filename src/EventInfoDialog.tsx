import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Slide } from "@mui/material";
import { useEffect, useState } from "react";
import { CalendarEvent } from "./MyCalendar";
import React from "react";
import { TransitionProps } from "@mui/material/transitions";

interface DialogProps {
    open: boolean;
    onClose: Function;
    event: CalendarEvent
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function EventInfoDialog(props: DialogProps) {
    const [open, setOpen] = useState<boolean>(props.open)

    useEffect(() => { setOpen(props.open) }, [props.open])

    return <Dialog open={open} onClose={() => { props.onClose() }} TransitionComponent={Transition} keepMounted
    >
        <DialogTitle>{props.event.title}</DialogTitle>
        <DialogContent>{props.event.desc}</DialogContent>
        <DialogActions>
            <Button onClick={() => props.onClose()}>Close</Button>
        </DialogActions>
    </Dialog>
}

