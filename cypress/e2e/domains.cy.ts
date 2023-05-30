function range(start, stop, step: number): number[] {
    const a: number[] = [start];
    let b: number = start;
    while (b < stop) {
        a.push(b += step || 1);
    }
    return a;
}

describe("domains", () => {
    it("domains loggedout", () => {
        cy.viewport(1280, 1024);
        cy.visit("/server");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Bitte melden Sie sich an!");
        cy.get("#new").should("not.exist");
    });
    it("domains loggedin empty", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://domain.api.example.edu/domains/", {
            statusCode: 200,
        }).as("getDomains");
        cy.visit("/domains");
        cy.wait(["@getSession", "@getDomains"]);
        cy.get("#new").should("be.visible");
        cy.get(".MuiDataGrid-overlay").should("be.visible").and("contain", "Keine Einträge");
    });
    it("domains loggedin data", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        const data = range(0, 100, 1).map(element => {
            return {
                "id": element,
                "fqdn": `test-${element}.example.edu`,
                "owner": "max.mustermann@example.edu",
                "delegations": [],
                "approved": element % 2 == 0,
                "permissions": { "can_delete": !(element % 2), "can_approve": (element % 2), "can_transfer": !(element % 2), "can_delegate": !(element % 2) },
            };
        });
        cy.intercept("https://domain.api.example.edu/domains/", {
            statusCode: 200,
            body: data,
        }).as("getDomains");
        cy.visit("/domains");
        cy.wait(["@getSession", "@getDomains"]);
        cy.get("#new").should("be.visible");
        cy.get(".MuiDataGrid-overlay").should("not.exist");
        cy.get("[data-id=\"0\"] > [data-field=\"fqdn\"] > .MuiDataGrid-cellContent").should("be.visible").and("contain", "test-0.example.edu");
        cy.get("[data-id=\"0\"] > .MuiDataGrid-cell--withRenderer.MuiDataGrid-cell--textLeft > .MuiBox-root > :nth-child(3)").should("be.enabled");
        cy.get("[data-id=\"1\"] > .MuiDataGrid-cell--withRenderer.MuiDataGrid-cell--textLeft > .MuiBox-root > :nth-child(3)").should("not.be.enabled");
        cy.get("body").then(elem => {
            // Check that elem[0] fits in viewport
            cy.window().then(win => {
                expect(elem[0].getBoundingClientRect().bottom).to.be.within(0, win.innerHeight);
            });
        });

    });
    it("domains loggedin error loading", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://domain.api.example.edu/domains/", {
            statusCode: 500,
        }).as("getDomains");
        cy.visit("/domains");
        cy.wait(["@getSession", "@getDomains"]);
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Ein unerwarteter Fehler ist aufgetreten.");
        cy.get("#new").should("not.exist");
    });
});
