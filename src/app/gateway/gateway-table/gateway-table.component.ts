import { Component, OnInit, OnChanges, OnDestroy, Input, ViewChild, AfterViewInit, EventEmitter } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { ChirpstackGatewayService } from 'src/app/shared/services/chirpstack-gateway.service';
import { TranslateService } from '@ngx-translate/core';
import { Sort } from '@shared/models/sort.model';
import { Gateway } from '../gateway.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { IotDevice } from '@applications/iot-devices/iot-device.model';
import { faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';


@Component({
  selector: 'app-gateway-table',
  templateUrl: './gateway-table.component.html',
  styleUrls: ['./gateway-table.component.scss']
})
export class GatewayTableComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns: string[] = ['name', 'gateway-id', 'location', 'last-seen', 'status', 'menu'];
  public dataSource = new MatTableDataSource<Gateway>();
  public gateways: Gateway[];
  gateway: Gateway;
  faExclamationTriangle = faExclamationTriangle;
  faCheckCircle = faCheckCircle;

  @Input() pageLimit: number;
  @Input() selectedSortObject: Sort;
  public pageOffset = 0;
  public pageTotal: number;

  batteryStatusColor = 'green';
  batteryStatusPercentage = 50;
  resultsLength = 0;
  isLoadingResults = true;
  deleteGateway = new EventEmitter();

  private gatewaySubscription: Subscription;

  constructor(
    private chirpstackGatewayService: ChirpstackGatewayService,
    public translate: TranslateService) {
    this.translate.use('da');
    moment.locale('da');
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges() {
    console.log('pageLimit', this.pageLimit);
    console.log('selectedSortId', this.selectedSortObject);
    this.getLoraGateways();
  }

  gatewayStatus(): boolean {
    return this.chirpstackGatewayService.isGatewayActive(this.gateway);
  }

  lastActive(gateway: Gateway): string {
    if (gateway?.lastSeenAt) {
      return moment(gateway.lastSeenAt).fromNow();
    } else {
      return this.translate.instant("ACTIVITY.NEVER");
    }
  }

  getLoraGateways(): void {
    this.gatewaySubscription = this.chirpstackGatewayService.getMultiple(
      {
        limit: this.pageLimit,
        offset: this.pageOffset * this.pageLimit,
        sort: this.selectedSortObject.dir,
        orderOn: this.selectedSortObject.col
      })
      .subscribe(
        (gateways) => {
          this.gateways = gateways.result;
          this.dataSource = new MatTableDataSource<Gateway>(this.gateways);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.isLoadingResults = false;
          this.resultsLength = this.gateways.length;
          if (this.pageLimit) {
            console.log(gateways.result);
            this.pageTotal = Math.ceil(gateways.count / this.pageLimit);
          }
        }
      );
  }

  clickDelete(element: any) {
    this.chirpstackGatewayService.delete(element.id).subscribe((response) => {
      if (response.ok && response.body.success === true) {
        this.deleteGateway.emit(element.id);
        this.getLoraGateways();
      }
    });
  }

  ngOnDestroy() {
    // prevent memory leak by unsubscribing
    if (this.gatewaySubscription) {
      this.gatewaySubscription.unsubscribe();
    }
  }

}
