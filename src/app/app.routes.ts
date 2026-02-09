import { Routes } from '@angular/router';
import { CustomersComponent } from './pages/customers/customers.component';
import { ProductsComponent } from './pages/products/products.component';
import { SalesRepsComponent } from './pages/sales-reps/sales-reps.component';
import { SalesOrdersComponent } from './pages/sales-orders/sales-orders.component';
import { SalesFactsComponent } from './pages/sales-facts/sales-facts.component';

export const routes: Routes = [
  { path: '', redirectTo: '/customers', pathMatch: 'full' },
  { path: 'customers', component: CustomersComponent, title: 'Customers' },
  { path: 'products', component: ProductsComponent, title: 'Products' },
  { path: 'sales-reps', component: SalesRepsComponent, title: 'Sales Reps' },
  { path: 'sales-orders', component: SalesOrdersComponent, title: 'Sales Orders' },
  { path: 'sales-facts', component: SalesFactsComponent, title: 'Sales Facts' },
  { path: '**', redirectTo: '/customers' }
];
