import Box from "@mui/system/Box";
import { QuickFilter, QuickFilterClear, QuickFilterControl, QuickFilterTrigger } from "@mui/x-data-grid/components";

export function QuickSearchToolbar() {
    return (
        <Box
            sx={{
                p: 0.5,
                pb: 0,
                pl: 1,
                pr: 1,
                textAlign: "center",
            }}
        >
            <QuickFilter defaultExpanded={true} >
                <QuickFilterTrigger />
                <QuickFilterControl />
                <QuickFilterClear />
            </QuickFilter>
        </Box>
    );
}