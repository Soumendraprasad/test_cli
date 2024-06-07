import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  ObjectCard,
  ObjectItemCard,
  Pagination,
  SmMenuItem,
} from '@app/shared/models/shared.models';
import { 
  exposureMenu,
  analysisMenu,
} from '../../../../core/models/menuconstant';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { CoreConfigService } from '@app/core/services/config.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PERMISSION_MESSAGE } from '@app/shared/components/workspace-browser/workspace.constant';
import { ExposureService } from '@app/features/exposures/services/exposure.service';
import { WorkspaceBrowserService } from '@app/shared/components/workspace-browser/workspace-browser.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'recently-viewed-analysis',
  templateUrl: './recently-viewed-analysis.component.html',
  styleUrls: ['./recently-viewed-analysis.component.scss'],
})
export class RecentlyViewedAnalysisComponent implements OnInit, OnDestroy {
  @ViewChild('ep') ep!: ContextMenu;
  analysisItemOptions: ObjectCard;
  analytics: ObjectItemCard[] = [];
  analyticsPagination: Pagination;
  userId: number = 0;
  workspaceId!: number;
  selectedSort: SmMenuItem = { name: 'Sort By', code: '1' };
  showConfirmPopup: boolean = false;
  exposureMenu: MenuItem[] = [];
  query: string = '';
  worskspaceSubscription: any;
  permissionMessage: any;
  confirmMessage: any;
  memberobjectData: any;
  selectedAnalysisExposure: any;
  workspacePagination = {
    from: 0,
    size: -1,
    count: 0,
  };
  workspaces: any[] = [];
  copyWorkspaceList: any[] = [];
  ngUnsubscribe = new Subject();

  constructor(
    private analyticsService: AnalyticsService,
    private _coreService: CoreConfigService,
    private exposureService: ExposureService,
    private workspaceBrowserService: WorkspaceBrowserService
  ) {
    this.analysisItemOptions = {
      defaultImg: '../../../../../assets/images/exposure_img.png',
      imagename: 'snapshort_path',
      object_type: 'exposure',
    };
    this.analyticsPagination = { from: 0, size: 10, count: 0 };
    this.exposureMenu = this.addPopup(analysisMenu);
    this._coreService
      .getcontextMenuChangeEmitter()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: any) => {
        this.memberobjectData = data.exposure;
        this.selectedAnalysisExposure = this.memberobjectData;
      });
    this.workspaceBrowserService
      .getWorkspaces(
        this.userId,
        this.workspacePagination.from,
        this.workspacePagination.size,
        this.query,
        this._coreService.getWorkspaceId()
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((obj: any) => {
        this.workspaces = [...obj.data];
      });
  }

  ngOnInit(): void {
    this.getItem('analysis');
    // this.subscription = this._coreService
    //   .getcontextMenuChangeEmitter()
    //   .subscribe((data: any) => this.showContextMenu(data.event, data.type));
    this.worskspaceSubscription = this._coreService.currentWorkspace
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((id: any) => {
        this.workspaceId = id;
        this.getItem('analysis');
      });
  }

  addPopup(menu: any): MenuItem[] {
    for (let i = 0; i < menu.length; i++) {
      if (menu[i].hasOwnProperty('command')) {
        menu[i]['command'] = () => {
          this.showPopup();
        };
      }
      if (menu[i].hasOwnProperty('items')) {
        this.addPopup(menu[i].items);
      }
    }
    return menu;
  }

  getItem = (events: any) => {
    if (this.workspaceId >= 0) {
      let pagination: Pagination = this.analyticsPagination;
      this.userId = this._coreService.getUserId();
      let params = {
        userId: this.userId,
        workspaceId: this.workspaceId,
        sortBy: this.selectedSort,
        activeTab: 'analysis',
        query: this.query,
      };
      this.analyticsService
        .getAnalyticsItem(pagination, params)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((obj: any) => {
          this.analytics = obj.analysis.data;
        });
    }
  };

  showContextMenu(event: MouseEvent, type: string) {
    let cm: ContextMenu;
    switch (type) {
      case 'exposure':
        cm = this.ep;
        break;
      default:
        cm = this.ep;
    }
    cm.show(event);
    event.stopPropagation();
  }

  showPopup() {
    this.permissionMessage = PERMISSION_MESSAGE.delete.warningMsg.title;
    this.confirmMessage = PERMISSION_MESSAGE.delete.warningMsg.msg;
    this.showConfirmPopup = true;
  }

  ngOnDestroy(): void {
    this.worskspaceSubscription?.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  closeDialog(event: any) {
    if (event) {
      this.deleteAnalysisExposure(this.selectedAnalysisExposure, 'delete');
      this.showConfirmPopup = false;
    } else {
      this.showConfirmPopup = false;
      return;
    }
  }

  reloadData(event?: any) {
    this.analytics = [];
    this.getItem('analysis');
  }

  deleteAnalysisExposure(exposure: ObjectItemCard, type: string) {
    this.showConfirmPopup = false;
    let parms: any = {
      id: exposure.id,
      objectType: 'analysis',
      userId: exposure.owner_user_id,
    };
    this.exposureService
      .deleteAnalysisObject(parms)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: any) => {
        if (data.delete_recent_analysis_4_0 === true) {
          this._coreService.showToastMessage(
            'success',
            'Success!',
            'Successfully Deleted'
          );
          setTimeout(() => {
            this.analytics = [];
            this.getItem('analysis');
          }, 1000);
        } else {
          this._coreService.showToastMessage(
            'error',
            'Unauthorized',
            'Permission Denied'
          );
        }
      });
  }
}
