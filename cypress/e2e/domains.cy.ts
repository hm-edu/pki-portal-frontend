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
    it("domains loggedin delete", () => {
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
        cy.intercept("https://pki.api.example.edu/ssl/active?domain=test-0.example.edu", {
            statusCode: 200,
            body: [ {
                    "id": 12345,
                    "common_name": "test-0.example.edu",
                    "status": "Issued",
                    "serial": "Test1234",
                    "subject_alternative_names": ["test-0.example.edu"],
                    "expires": { "seconds": 1714694399 },
                    "not_before": { "seconds": 1683072000 },
                    "issued_by": "test.test@hm.edu (EAB: Test)",
                    "created": { "seconds": 1683101517, "nanos": 943448000 },
                    "source": "ACME",
                    "db_id": 1
                },{
                    "id": 12346,
                    "common_name": "test-0.example.edu",
                    "status": "Issued",
                    "serial": "Test12345",
                    "subject_alternative_names": ["test-0.example.edu"],
                    "expires": { "seconds": 1714694399 },
                    "not_before": { "seconds": 1683072000 },
                    "issued_by": "test.test@hm.edu (EAB: Test)",
                    "created": { "seconds": 1683101517, "nanos": 943448000 },
                    "source": "ACME",
                    "db_id": 1
                }],
        }).as("getActive");
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
        cy.get("[data-id=\"0\"] > .MuiDataGrid-cell--withRenderer.MuiDataGrid-cell--textLeft > .MuiBox-root > :nth-child(2)").should("be.enabled");
        cy.get("[data-id=\"0\"] > .MuiDataGrid-cell--withRenderer.MuiDataGrid-cell--textLeft > .MuiBox-root > :nth-child(2)").click();
        cy.wait(["@getActive"]);
        cy.get("#toBeRevoked").should("be.visible").and("contain", "Serial: Test12345");
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
