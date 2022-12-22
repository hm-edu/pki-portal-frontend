import Box from "@mui/system/Box";
import { GridToolbarQuickFilter } from "@mui/x-data-grid/components";

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
            <GridToolbarQuickFilter sx={{ minWidth: "100%", maxWidth: "100%" }} />
        </Box>
    );
}