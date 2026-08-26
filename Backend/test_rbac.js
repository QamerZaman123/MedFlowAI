import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import router from './Routes/Route.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret123';
const COOKIE_NAME = process.env.COOKIE_NAME || 'mycookie';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api', router);

async function runTests() {
  console.log('=== Starting Fast RBAC Backend Test Suite ===\n');

  let testCount = 0;
  let passCount = 0;

  function assert(condition, testName) {
    testCount++;
    if (condition) {
      console.log(`[PASS] Test ${testCount}: ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] Test ${testCount}: ${testName}`);
    }
  }

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`Test server running on port ${port}\n`);

  try {
    console.log('--- Test Group: HTTP Route & Middleware RBAC Verification ---');

    // Create JWT tokens for each role
    const adminToken = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'admin' }, JWT_SECRET);
    const doctorToken = jwt.sign({ id: '507f1f77bcf86cd799439012', role: 'doctor' }, JWT_SECRET);
    const recepToken = jwt.sign({ id: '507f1f77bcf86cd799439013', role: 'receptionist' }, JWT_SECRET);

    const adminCookie = `${COOKIE_NAME}=${adminToken}`;
    const doctorCookie = `${COOKIE_NAME}=${doctorToken}`;
    const recepCookie = `${COOKIE_NAME}=${recepToken}`;

    // 1. Admin Route: GET /api/admin/users
    const resAdminUsersAsAdmin = await fetch(`${baseUrl}/admin/users`, { headers: { Cookie: adminCookie } });
    assert(resAdminUsersAsAdmin.status === 200, 'Admin accessing admin-only endpoint /api/admin/users -> 200 OK');

    const resAdminUsersAsDoc = await fetch(`${baseUrl}/admin/users`, { headers: { Cookie: doctorCookie } });
    assert(resAdminUsersAsDoc.status === 403, 'Doctor accessing admin-only endpoint /api/admin/users -> 403 Forbidden');

    const resAdminUsersAsRecep = await fetch(`${baseUrl}/admin/users`, { headers: { Cookie: recepCookie } });
    assert(resAdminUsersAsRecep.status === 403, 'Receptionist accessing admin-only endpoint /api/admin/users -> 403 Forbidden');

    // 2. Doctor Route: GET /api/doctor/consultations
    const resDocConsultAsDoc = await fetch(`${baseUrl}/doctor/consultations`, { headers: { Cookie: doctorCookie } });
    assert(resDocConsultAsDoc.status === 200, 'Doctor accessing doctor-only endpoint /api/doctor/consultations -> 200 OK');

    const resDocConsultAsRecep = await fetch(`${baseUrl}/doctor/consultations`, { headers: { Cookie: recepCookie } });
    assert(resDocConsultAsRecep.status === 403, 'Receptionist accessing doctor-only endpoint /api/doctor/consultations -> 403 Forbidden');

    const resDocCopilotAsDoc = await fetch(`${baseUrl}/doctor/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: doctorCookie },
      body: JSON.stringify({ query: 'Hypertension treatment options' })
    });
    assert(resDocCopilotAsDoc.status === 200, 'Doctor accessing doctor AI Copilot endpoint -> 200 OK');

    const resDocCopilotAsRecep = await fetch(`${baseUrl}/doctor/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepCookie },
      body: JSON.stringify({ query: 'Hypertension treatment options' })
    });
    assert(resDocCopilotAsRecep.status === 403, 'Receptionist accessing doctor AI Copilot endpoint -> 403 Forbidden');

    // 3. Receptionist Route: POST /api/receptionist/patients
    const resRecepPatientAsRecep = await fetch(`${baseUrl}/receptionist/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: recepCookie },
      body: JSON.stringify({ name: 'John Smith', age: 50, gender: 'Male' })
    });
    assert(resRecepPatientAsRecep.status === 201, 'Receptionist registering patient via /api/receptionist/patients -> 201 Created');

    const resRecepPatientAsDoc = await fetch(`${baseUrl}/receptionist/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: doctorCookie },
      body: JSON.stringify({ name: 'John Smith', age: 50, gender: 'Male' })
    });
    assert(resRecepPatientAsDoc.status === 403, 'Doctor accessing receptionist-only endpoint -> 403 Forbidden');

    // 4. Shared Route: GET /api/patients/search
    const resSharedAsDoc = await fetch(`${baseUrl}/patients/search?query=John`, { headers: { Cookie: doctorCookie } });
    assert(resSharedAsDoc.status === 200, 'Doctor accessing shared patient search -> 200 OK');

    const resSharedAsRecep = await fetch(`${baseUrl}/patients/search?query=John`, { headers: { Cookie: recepCookie } });
    assert(resSharedAsRecep.status === 200, 'Receptionist accessing shared patient search -> 200 OK');

    const resSharedAsAdmin = await fetch(`${baseUrl}/patients/search?query=John`, { headers: { Cookie: adminCookie } });
    assert(resSharedAsAdmin.status === 200, 'Admin accessing shared patient search -> 200 OK');

    // 5. Unauthenticated Request
    const resNoAuth = await fetch(`${baseUrl}/admin/users`);
    assert(resNoAuth.status === 401, 'Unauthenticated request to protected route returns 401 Unauthorized');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
  }

  console.log(`\n=== Test Results: ${passCount}/${testCount} Passed ===\n`);
  process.exit(passCount === testCount ? 0 : 1);
}

runTests();
