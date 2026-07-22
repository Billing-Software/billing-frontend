# Implementation Tasks - Branches & Subscriptions

## 1. Database & Infrastructure
- [x] Implement database alterations in Migrator (AllowedStaff, BranchId)
- [x] Add AllowedStaff to Business entity
- [x] Add BranchId to StaffMember entity and configure relations
- [x] Register new DbConfigurations in BillingDbContext

## 2. Backend Repositories & Services
- [x] Pass AllowedStaff parameter in RegisterUserAndBusinessWithSubscriptionAsync
- [x] Resolve and pass MaxStaff from plan during payment verification
- [x] Add Include(s => s.Branch) in StaffRepository entity loaders
- [x] Set BranchId in StaffRepository Add/Update methods
- [x] Map BranchId/BranchName in StaffDto
- [x] Add staff registration count limits validation in StaffService

## 3. Frontend Global Config (`smartbill-pro`)
- [x] Define Branch type in branch.types.ts
- [x] Fetch branches and switch dynamically in AuthContext.tsx
- [x] Map Branches route in AppRoutes.tsx
- [x] Render link to Branches page in Navbar/Sidebar layouts

## 4. Frontend Interactive UI Pages (`smartbill-pro`)
- [x] Build Branches.tsx list, create, update management page
- [x] Display Subscription limit alerts in Branches.tsx page
- [x] Implement active branch switcher dropdown list in Header.tsx
- [x] Fetch branches on mount and add Assigned Branch selector in Staff.tsx
