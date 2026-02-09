import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesRep } from '../../models/sales-rep.model';
import { SalesRepService } from '../../services/sales-rep.service';

@Component({
  selector: 'app-sales-reps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-reps.component.html',
  styleUrl: './sales-reps.component.scss'
})
export class SalesRepsComponent implements OnInit {
  salesReps: SalesRep[] = [];
  filteredReps: SalesRep[] = [];
  loading = true;

  searchName = '';
  filterRegion = '';
  regions: string[] = [];

  constructor(private salesRepService: SalesRepService) {}

  ngOnInit(): void {
    this.salesRepService.getAll().subscribe({
      next: data => {
        this.salesReps = data;
        this.filteredReps = data;
        this.regions = [...new Set(data.map(r => r.region).filter(Boolean) as string[])].sort();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters(): void {
    this.filteredReps = this.salesReps.filter(r => {
      const matchesName = !this.searchName || r.repName.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesRegion = !this.filterRegion || r.region === this.filterRegion;
      return matchesName && matchesRegion;
    });
  }

  clearFilters(): void {
    this.searchName = '';
    this.filterRegion = '';
    this.filteredReps = this.salesReps;
  }
}
