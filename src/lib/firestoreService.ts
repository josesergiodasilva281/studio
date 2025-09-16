

import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query, orderBy, limit, where, getDoc } from 'firebase/firestore';
import type { Employee, Visitor, Car, AccessLog, CarLog } from './types';

// --- Coleções ---
const EMPLOYEES_COLLECTION = 'employees';
const VISITORS_COLLECTION = 'visitors';
const CARS_COLLECTION = 'cars';
const ACCESS_LOGS_COLLECTION = 'accessLogs';
const CAR_LOGS_COLLECTION = 'carLogs';

// --- Funcionários ---

const initialEmployees: Omit<Employee, 'id' | 'photoDataUrl'>[] = [
  { name: 'João da Silva', department: 'Produção', plate: 'ABC-1234', ramal: '2101', status: 'Ativo', portaria: 'P1' },
  { name: 'Maria Oliveira', department: 'Logística', plate: 'DEF-5678', ramal: '2102', status: 'Ativo', portaria: 'P2' },
  { name: 'Pedro Souza', department: 'Administrativo', plate: 'GHI-9012', ramal: '2103', status: 'Inativo', inactiveUntil: null },
];

export const getEmployeesFromFirestore = async (): Promise<Employee[]> => {
    const q = query(collection(db, EMPLOYEES_COLLECTION), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};

export const addEmployeeToFirestore = async (employee: Employee): Promise<void> => {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
    await setDoc(employeeDocRef, employee);
};

export const updateEmployeeInFirestore = async (employee: Employee): Promise<void> => {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
    await setDoc(employeeDocRef, employee, { merge: true });
};

export const updateEmployeeIdInFirestore = async (oldId: string, newId: string): Promise<void> => {
    const oldDocRef = doc(db, EMPLOYEES_COLLECTION, oldId);
    const oldDocSnap = await getDoc(oldDocRef);

    if (!oldDocSnap.exists()) {
        throw new Error("Funcionário original não encontrado.");
    }

    const employeeData = oldDocSnap.data() as Employee;
    
    // 1. Crie o novo documento do funcionário
    const newEmployeeData = { ...employeeData, id: newId };
    const newDocRef = doc(db, EMPLOYEES_COLLECTION, newId);
    await setDoc(newDocRef, newEmployeeData);

    // 2. Encontre e atualize todos os logs de acesso
    const logsQuery = query(collection(db, ACCESS_LOGS_COLLECTION), where("personId", "==", oldId));
    const logsSnapshot = await getDocs(logsQuery);

    const batch = writeBatch(db);
    logsSnapshot.forEach(logDoc => {
        const logRef = doc(db, ACCESS_LOGS_COLLECTION, logDoc.id);
        batch.update(logRef, { personId: newId });
    });
    
    // 3. Exclua o documento antigo do funcionário
    batch.delete(oldDocRef);
    
    // 4. Commit todas as alterações
    await batch.commit();
}


export const deleteEmployeeFromFirestore = async (employeeId: string): Promise<void> => {
    await deleteDoc(doc(db, EMPLOYEES_COLLECTION, employeeId));
};

export const addInitialEmployeesToFirestore = async (): Promise<void> => {
    const batch = writeBatch(db);
    initialEmployees.forEach((employeeData, index) => {
        const id = (index + 1).toString();
        const employee: Partial<Employee> = { ...employeeData, status: 'Ativo', photoDataUrl: '' };
         if (employeeData.name === 'Pedro Souza') {
            employee.status = 'Inativo';
        }
        const docRef = doc(db, EMPLOYEES_COLLECTION, id);
        batch.set(docRef, {id, ...employee });
    });
    await batch.commit();
};

export const bulkUpdateEmployeesInFirestore = async (employees: Employee[]): Promise<void> => {
    const batch = writeBatch(db);
    employees.forEach((employee) => {
        // If ID is empty, it's a new employee from a 4-column CSV. Generate a new doc ref.
        const docRef = employee.id ? doc(db, EMPLOYEES_COLLECTION, employee.id) : doc(collection(db, EMPLOYEES_COLLECTION));
        
        // The document data should include the newly generated ID.
        const employeeData = { ...employee, id: docRef.id };

        batch.set(docRef, employeeData, { merge: true });
    });
    await batch.commit();
};


// --- Visitantes ---

export const getVisitorsFromFirestore = async (): Promise<Visitor[]> => {
    const q = query(collection(db, VISITORS_COLLECTION), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visitor));
};

export const addOrUpdateVisitorInFirestore = async (visitor: Visitor): Promise<void> => {
    await setDoc(doc(db, VISITORS_COLLECTION, visitor.id), visitor);
};

export const deleteVisitorFromFirestore = async (visitorId: string): Promise<void> => {
    await deleteDoc(doc(db, VISITORS_COLLECTION, visitorId));
};

// --- Carros ---

export const getCarsFromFirestore = async (): Promise<Car[]> => {
    const q = query(collection(db, CARS_COLLECTION), orderBy('fleet'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car));
};

export const addOrUpdateCarInFirestore = async (car: Car): Promise<void> => {
    await setDoc(doc(db, CARS_COLLECTION, car.id), car);
};

export const deleteCarFromFirestore = async (carId: string): Promise<void> => {
    await deleteDoc(doc(db, CARS_COLLECTION, carId));
};

// --- Logs de Acesso (Pessoas) ---

export const getAccessLogsFromFirestore = async (count: number = 50): Promise<AccessLog[]> => {
    const q = query(collection(db, ACCESS_LOGS_COLLECTION), orderBy('entryTimestamp', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessLog));
};

export const addOrUpdateAccessLogInFirestore = async (log: AccessLog): Promise<void> => {
    await setDoc(doc(db, ACCESS_LOGS_COLLECTION, log.id), log);
};

export const deleteAccessLogsInFirestore = async (logIds: string[]): Promise<void> => {
    if (logIds.length === 0) {
        return;
    }
    const batch = writeBatch(db);
    logIds.forEach(logId => {
        const docRef = doc(db, ACCESS_LOGS_COLLECTION, logId);
        batch.delete(docRef);
    });
    await batch.commit();
};


// --- Logs de Carros ---

export const getCarLogsFromFirestore = async (count: number = 50): Promise<CarLog[]> => {
    const q = query(collection(db, CAR_LOGS_COLLECTION), orderBy('startTime', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarLog));
};

export const addOrUpdateCarLogInFirestore = async (log: CarLog): Promise<void> => {
    await setDoc(doc(db, CAR_LOGS_COLLECTION, log.id), log);
};
