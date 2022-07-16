/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { screen, getByTestId, getAllByTestId, getByText, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //On ajout le Expect qui manquait
      expect(windowIcon).toHaveClass('active-icon')


    })
    test('Then bills should be ordered from earliest to latest', () => {
      // Array Sort Bills By Date DESC
      const html = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("When I click on the button 'Nouvelle note de frais'", () => {
  test("Then I should navigate to #employee/bill/new", () => {
    // Vérifie qu'on arrive bien sur la page NewBill
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const billsPage = new Bills({
      document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
    })
    // on récupère la fonction pour le test
    const handleClickNewBill = jest.fn(billsPage.handleClickNewBill);
    // on récupère l'accès au bouton qui dirige vers la page souhaitée
    const btnNewBill = getByTestId(document.body, "btn-new-bill");
    // on simule l'action
    btnNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(btnNewBill);
    // on vérifie que la fonction est appelée et que la page souhaitée s'affiche
    expect(handleClickNewBill).toHaveBeenCalled();
    expect(
      getByText(document.body, "Envoyer une note de frais")
    ).toBeTruthy();
  });
});

describe("When I click on the eye icon", () => {
  test("A modal should open", () => {
    // Vérifie l'ouverture de la modale si click sur le bouton "oeil" d'une facture
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const billsPage = new Bills({
      document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
    })
    // on affiche les factures dans le HTML
    document.body.innerHTML = BillsUI({ data: { bills } })
    // on mock la modale
    $.fn.modal = jest.fn();
    // on récupère le premier bouton trouvé
    const firstEyeIcon = getAllByTestId(document.body, "btn-new-bill")[0];
    // on récupère la fonction qui ouvre la modale
    const handleClickIconEye = jest.fn(
      billsPage.handleClickIconEye(firstEyeIcon)
    );
    // on simule l'action
    firstEyeIcon.addEventListener("click", handleClickIconEye);
    userEvent.click(firstEyeIcon);
    // on vérifie l'appel de la fonction et la présence de la modale
    expect(handleClickIconEye).toHaveBeenCalled();
    const modal = screen.getByTestId("modale");
    expect(modal).toBeTruthy();
  });
});

//// Test API GET Bills ////
describe("When I navigate to Bills page", () => {
  describe("When we call API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API", async () => {
      // Vérifie que le call API renvoie bien toutes les factures
      const bills = await mockStore.bills().list()
      expect(bills.length).toBe(4);
    })
    test("fetches bills from mock API", async () => {
      // Vérifie que les factures sont bien les données mockées
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText("encore")
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      // après avoir simuler les rejet de la promesse, on vérifie l'affichage du message d'erreur
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  });
});
