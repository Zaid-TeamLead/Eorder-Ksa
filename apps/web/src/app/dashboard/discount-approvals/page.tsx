'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApproveDiscountDialog } from '@/components/quotation/approve-discount-dialog';
import { useDiscountApprovals } from '@/hooks/entities/useDiscountApprovals';
import type { DiscountApproval } from '@/types/quotation';

// Shared utilities and components
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getDiscountApprovalStatusColor } from '@/lib/quotation-utils';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';

export default function DiscountApprovalsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [expandedApprovalId, setExpandedApprovalId] = useState<number | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<DiscountApproval | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const { approvals, isLoading, error, refetch } = useDiscountApprovals();

  // Memoize filtered approvals to avoid recalculating on every render
  const filteredApprovals = useMemo(
    () => statusFilter === 'all'
      ? approvals
      : approvals.filter((approval) => approval.STATUS === statusFilter),
    [approvals, statusFilter]
  );

  const handleApprovalSuccess = () => {
    // React Query automatically refetches due to cache invalidation in mutation
    setApprovalDialogOpen(false);
    setSelectedApproval(null);
  };

  const toggleExpandApproval = (approvalId: number) => {
    setExpandedApprovalId(expandedApprovalId === approvalId ? null : approvalId);
  };

  const handleApproveClick = (approval: DiscountApproval) => {
    setSelectedApproval(approval);
    setApprovalDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingState message="Loading discount approvals..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Approvals"
        message={error.message || 'Failed to load discount approvals'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discount Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve discount requests from sales team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
          <CardDescription>
            {filteredApprovals.length} {statusFilter !== 'all' ? statusFilter.toLowerCase() : ''}{' '}
            {filteredApprovals.length === 1 ? 'request' : 'requests'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApprovals.length === 0 ? (
            <EmptyState
              title={`No ${statusFilter !== 'all' ? statusFilter.toLowerCase() : ''} approval requests found`}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Discount Amount</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Over Limit By</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval) => {
                  const discountPercentage = Number(approval.DISCOUNT_PERCENTAGE || 0);

                  return [
                    <TableRow
                      key={`row-${approval.SLNO}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpandApproval(approval.SLNO)}
                    >
                      <TableCell>
                        {expandedApprovalId === approval.SLNO ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        #{approval.QUOTATION_SLNO}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{approval.REQUESTED_BY}</p>
                          <p className="text-sm text-muted-foreground">
                            {approval.REQUESTED_BY_SLPCODE}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(approval.DISCOUNT_AMOUNT)}</TableCell>
                      <TableCell>{discountPercentage.toFixed(2)}%</TableCell>
                      <TableCell>
                        <span className="font-medium text-destructive">
                          {formatCurrency(approval.AMOUNT_OVER_LIMIT)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(approval.REQUESTED_DATE, { includeTime: true })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getDiscountApprovalStatusColor(approval.STATUS)}>
                          {approval.STATUS}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {approval.STATUS === 'Pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveClick(approval);
                                }}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Review
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/quotations/print/${approval.QUOTATION_SLNO}`);
                            }}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ,

                    expandedApprovalId === approval.SLNO && (
                      <TableRow key={`details-${approval.SLNO}`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="mb-4 font-semibold">Request Details</h4>
                              <dl className="space-y-2">
                                <div>
                                  <dt className="text-sm text-muted-foreground">Request Type</dt>
                                  <dd className="font-medium">{approval.REQUEST_TYPE}</dd>
                                </div>
                                <div>
                                  <dt className="text-sm text-muted-foreground">
                                    User's Discount Limit
                                  </dt>
                                  <dd className="font-medium">
                                    {formatCurrency(approval.USER_DISCOUNT_LIMIT)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm text-muted-foreground">Assigned To</dt>
                                  <dd className="font-medium">{approval.ASSIGNED_TO}</dd>
                                </div>
                                {approval.ASSIGNED_TO_ROLE && (
                                  <div>
                                    <dt className="text-sm text-muted-foreground">Role</dt>
                                    <dd className="font-medium">{approval.ASSIGNED_TO_ROLE}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>

                            <div>
                              <h4 className="mb-4 font-semibold">Justification</h4>
                              <p className="rounded-md bg-background p-3 text-sm">
                                {approval.JUSTIFICATION}
                              </p>

                              {approval.STATUS !== 'Pending' && (
                                <div className="mt-4">
                                  <h4 className="mb-2 font-semibold">
                                    {approval.STATUS === 'Approved' ? 'Approval' : 'Rejection'}{' '}
                                    Details
                                  </h4>
                                  <dl className="space-y-2">
                                    <div>
                                      <dt className="text-sm text-muted-foreground">
                                        {approval.STATUS === 'Approved'
                                          ? 'Approved By'
                                          : 'Rejected By'}
                                      </dt>
                                      <dd className="font-medium">{approval.APPROVED_BY}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-sm text-muted-foreground">Date</dt>
                                      <dd className="font-medium">
                                        {approval.APPROVED_DATE
                                          ? formatDate(approval.APPROVED_DATE, { includeTime: true })
                                          : '-'}
                                      </dd>
                                    </div>
                                    {approval.APPROVAL_NOTES && (
                                      <div>
                                        <dt className="text-sm text-muted-foreground">Notes</dt>
                                        <dd className="rounded-md bg-background p-2 text-sm">
                                          {approval.APPROVAL_NOTES}
                                        </dd>
                                      </div>
                                    )}
                                    {approval.REJECTION_REASON && (
                                      <div>
                                        <dt className="text-sm text-muted-foreground">
                                          Rejection Reason
                                        </dt>
                                        <dd className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                                          {approval.REJECTION_REASON}
                                        </dd>
                                      </div>
                                    )}
                                  </dl>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  ];
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Dialog */}
      {selectedApproval && (
        <ApproveDiscountDialog
          approval={selectedApproval}
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </div>
  );
}
