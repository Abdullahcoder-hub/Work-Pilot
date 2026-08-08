import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from './projectsApi';
import { ProjectFormInput } from './projectsApi';

const LIST_KEY = ['projects'];
const DETAIL_KEY = (id: string) => ['projects', id];

export function useProjects() {
  return useQuery({ queryKey: LIST_KEY, queryFn: projectsApi.listProjects });
}

export function useProject(id: string | undefined) {
  return useQuery({ queryKey: DETAIL_KEY(id ?? ''), queryFn: () => projectsApi.getProject(id as string), enabled: !!id });
}

function useInvalidate(id?: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: LIST_KEY });
    if (id) void queryClient.invalidateQueries({ queryKey: DETAIL_KEY(id) });
  };
}

export function useCreateProject() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (input: ProjectFormInput) => projectsApi.createProject(input), onSuccess: invalidate });
}

export function useUpdateProject(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (input: Partial<ProjectFormInput>) => projectsApi.updateProject(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => projectsApi.deleteProject(id), onSuccess: invalidate });
}

export function useAddProjectMember(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({ mutationFn: (userId: string) => projectsApi.addMember(id, userId), onSuccess: invalidate });
}

export function useRemoveProjectMember(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({ mutationFn: (userId: string) => projectsApi.removeMember(id, userId), onSuccess: invalidate });
}
