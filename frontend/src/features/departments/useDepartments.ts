import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as departmentsApi from './departmentsApi';
import { DepartmentFormInput } from './departmentsApi';

const KEY = ['departments'];

export function useDepartments() {
  return useQuery({ queryKey: KEY, queryFn: departmentsApi.listDepartments });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: KEY });
}

export function useCreateDepartment() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (input: DepartmentFormInput) => departmentsApi.createDepartment(input), onSuccess: invalidate });
}

export function useUpdateDepartment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DepartmentFormInput> }) => departmentsApi.updateDepartment(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => departmentsApi.deleteDepartment(id), onSuccess: invalidate });
}
