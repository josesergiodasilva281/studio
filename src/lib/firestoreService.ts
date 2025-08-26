
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Employee } from './types';

const EMPLOYEES_COLLECTION = 'employees';

const initialEmployees: Employee[] = [
  { id: '1', name: 'João da Silva', department: 'Produção', plate: 'ABC-1234', ramal: '2101', status: 'Ativo', portaria: 'P1' },
  { id: '2', name: 'Maria Oliveira', department: 'Logística', plate: 'DEF-5678', ramal: '2102', status: 'Ativo', portaria: 'P2' },
  { id: '3', name: 'Pedro Souza', department: 'Administrativo', plate: 'GHI-9012', ramal: '2103', status: 'Inativo' },
];

export const getEmployeesFromFirestore = async (): Promise<Employee[]> => {
    const querySnapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    const employees: Employee[] = [];
    querySnapshot.forEach((doc) => {
        employees.push({ id: doc.id, ...doc.data() } as Employee);
    });
    return employees;
};

export const addEmployeeToFirestore = async (employee: Employee): Promise<void> => {
    // Ensure the document ID is the same as the employee ID
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
    await setDoc(employeeDocRef, employee);
};

export const updateEmployeeInFirestore = async (employee: Employee): Promise<void> => {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
    await setDoc(employeeDocRef, employee, { merge: true });
};

export const deleteEmployeeFromFirestore = async (employeeId: string): Promise<void> => {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    await deleteDoc(employeeDocRef);
};

export const addInitialEmployeesToFirestore = async (): Promise<void> => {
    const batch = writeBatch(db);
    initialEmployees.forEach((employee) => {
        const docRef = doc(db, EMPLOYEES_COLLECTION, employee.id);
        batch.set(docRef, employee);
    });
    await batch.commit();
};
